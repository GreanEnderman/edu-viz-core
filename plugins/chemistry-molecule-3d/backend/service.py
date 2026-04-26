"""Plugin backend module for chemistry-molecule-3d.

Hosted by the AhaTutor platform. Provides molecule structure generation,
info retrieval, and validation via RDKit (with optional XTB/ASE for inorganic).

Entry point: invoke(action, payload, context) -> dict
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Optional

from .schemas import ParseResult, MoleculeData, AtomData, BondData

# RDKit imports
from rdkit import Chem
from rdkit.Chem import AllChem, Descriptors, rdMolDescriptors

# Optional: XTB + ASE for quantum chemistry geometry optimization
XTB_AVAILABLE = False
try:
    from ase import Atoms
    from ase.optimize import BFGS
    try:
        from xtb.ase.calculator import XTBCalculator
        XTB_AVAILABLE = True
    except ImportError:
        pass
except ImportError:
    pass

# Optional: OpenBabel (deprecated, fallback only)
OPENBABEL_AVAILABLE = False
try:
    from openbabel import pybel
    OPENBABEL_AVAILABLE = True
except ImportError:
    pass

# Data file path
_DATA_FILE = Path(__file__).parent / "data" / "name_mapping.json"

# Name mapping cache
_NAME_MAPPING_CACHE: Optional[dict[str, str]] = None

# Inorganic molecule detection patterns
_INORGANIC_PATTERNS = [
    r'^[A-Z][a-z]?\d*[FClBrIO][123456]*$',
    r'^[A-Z][a-z]?\d*F\d+$',
    r'^Xe[IFOC]\d*$',
    r'^[A-Z][a-z]?[FClBrIO]3$',
    r'^[A-Z][a-z]?[FClBrIO]5$',
    r'^[A-Z][a-z]?[FClBrIO]7$',
    r'^[A-Z][a-z]?\d*O\d*[234]*$',
]


# ===== Name mapping =====

def load_name_mapping() -> dict[str, str]:
    """Load and flatten name-to-SMILES mapping from JSON data file."""
    global _NAME_MAPPING_CACHE
    if _NAME_MAPPING_CACHE is not None:
        return _NAME_MAPPING_CACHE

    if not _DATA_FILE.exists():
        _NAME_MAPPING_CACHE = {}
        return {}

    with open(_DATA_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    def flatten(d: dict, out: dict) -> None:
        for key, value in d.items():
            if isinstance(value, dict):
                flatten(value, out)
            else:
                out[key] = value

    mapping: dict[str, str] = {}
    for category, items in data.items():
        if category == "_metadata":
            continue
        if isinstance(items, dict):
            flatten(items, mapping)

    _NAME_MAPPING_CACHE = mapping
    return mapping


def name_to_smiles(name: str) -> Optional[str]:
    """Resolve a name (Chinese/English/formula) to SMILES string."""
    name = name.strip()
    if not name:
        return None

    mapping = load_name_mapping()

    if name in mapping:
        return mapping[name]

    # Maybe it's already a valid SMILES
    mol = Chem.MolFromSmiles(name)
    if mol is not None:
        return name

    return None


# ===== Inorganic detection =====

def is_inorganic(smiles: str) -> bool:
    """Detect whether a SMILES string represents an inorganic molecule."""
    smiles = smiles.strip()

    if '[' in smiles and ']' in smiles:
        return True

    for pattern in _INORGANIC_PATTERNS:
        if re.match(pattern, smiles):
            return True

    elements = set(re.findall(r'[A-Z][a-z]?', smiles))
    if len(elements) <= 2 and not any(e in {'C', 'N', 'O', 'S', 'P'} for e in elements):
        return elements <= {'H', 'F', 'Cl', 'Br', 'I', 'B', 'Si'}

    return False


# ===== 3D generation strategies =====

def _set_manual_coordinates(mol) -> None:
    """Linear X-axis placement for ions and single atoms."""
    num_atoms = mol.GetNumAtoms()
    mol.RemoveAllConformers()
    conf = Chem.Conformer(num_atoms)
    for i in range(num_atoms):
        atom = mol.GetAtomWithIdx(i)
        charge = atom.GetFormalCharge()
        if charge > 0:
            x = -2.0 - i * 2.5
        elif charge < 0:
            x = 2.0 + i * 2.5
        else:
            x = i * 1.5
        conf.SetAtomPosition(i, (x, 0.0, 0.0))
    mol.AddConformer(conf)


def _generate_rdkit_3d(mol) -> None:
    """ETKDGv3 embedding + MMFF/UFF optimization for organic molecules."""
    num_bonds = mol.GetNumBonds()
    if num_bonds > 0:
        params = AllChem.ETKDGv3()
        params.randomSeed = 42
        params.useExpTorsionAnglePrefs = True
        params.useBasicKnowledge = True

        if AllChem.EmbedMolecule(mol, params) != -1:
            try:
                AllChem.MMFFOptimizeMolecule(mol, maxIters=500)
            except Exception:
                try:
                    AllChem.UFFOptimizeMolecule(mol, maxIters=500)
                except Exception:
                    pass
        else:
            _set_manual_coordinates(mol)
    else:
        _set_manual_coordinates(mol)


def _try_xtb_3d(mol) -> bool:
    """XTB/GFN2-xTB quantum chemistry optimization. Returns True on success."""
    if not XTB_AVAILABLE:
        return False

    try:
        num_atoms = mol.GetNumAtoms()
        symbols = [mol.GetAtomWithIdx(i).GetSymbol() for i in range(num_atoms)]
        atoms = Atoms(symbols)

        params = AllChem.ETKDGv3()
        params.randomSeed = 42
        if AllChem.EmbedMolecule(mol, params) != -1:
            conf = mol.GetConformer()
            atoms.set_positions(
                [[conf.GetAtomPosition(i).x, conf.GetAtomPosition(i).y, conf.GetAtomPosition(i).z] for i in range(num_atoms)]
            )
        else:
            atoms.set_positions([[i * 2.0, 0.0, 0.0] for i in range(num_atoms)])

        atoms.calc = XTBCalculator(method="GFN2-xTB")
        BFGS(atoms, logfile=None).run(fmax=0.05, steps=1000)

        final = atoms.get_positions()
        new_conf = Chem.Conformer(num_atoms)
        for i in range(num_atoms):
            new_conf.SetAtomPosition(i, (final[i][0], final[i][1], final[i][2]))
        mol.RemoveAllConformers()
        mol.AddConformer(new_conf)
        return True
    except Exception:
        return False


def _try_openbabel_3d(smiles: str) -> Optional[Chem.Mol]:
    """OpenBabel fallback (deprecated). Returns RDKit Mol or None."""
    if not OPENBABEL_AVAILABLE:
        return None
    try:
        ob_mol = pybel.readstring("smi", smiles)
        if not ob_mol:
            return None
        ob_mol.make3D(forcefield="mmff94")
        sdf = ob_mol.write("sdf")
        return Chem.MolFromMolBlock(sdf)
    except Exception:
        return None


def _parse_molecule(input_str: str) -> tuple[Optional[Chem.Mol], str, Optional[str]]:
    """
    Parse input (SMILES or name) into an RDKit Mol with 3D coordinates.
    Returns (mol, canonical_smiles, error_msg).
    """
    input_str = input_str.strip()
    if not input_str:
        return None, "", "Input is empty"

    # Try name resolution first
    resolved = name_to_smiles(input_str)
    smiles = resolved if resolved else input_str

    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return None, "", f"Invalid input: not a valid SMILES or known name"

    mol = Chem.AddHs(mol)

    # Generate 3D coordinates with strategy selection
    if is_inorganic(smiles) and XTB_AVAILABLE:
        if not _try_xtb_3d(mol):
            _generate_rdkit_3d(mol)
    elif is_inorganic(smiles) and OPENBABEL_AVAILABLE:
        ob_mol = _try_openbabel_3d(smiles)
        if ob_mol:
            mol = ob_mol
        else:
            _generate_rdkit_3d(mol)
    else:
        _generate_rdkit_3d(mol)

    # Get canonical SMILES (without hydrogens)
    canonical = Chem.MolToSmiles(Chem.RemoveHs(mol))

    return mol, canonical, None


def _mol_to_atom_bond_data(mol: Chem.Mol, canonical_smiles: str) -> dict[str, Any]:
    """Extract atoms, bonds, and metadata from an RDKit Mol."""
    conf = mol.GetConformer()

    atoms = []
    for i in range(mol.GetNumAtoms()):
        atom = mol.GetAtomWithIdx(i)
        pos = conf.GetAtomPosition(i)
        atoms.append({
            "element": atom.GetSymbol(),
            "x": round(pos.x, 4),
            "y": round(pos.y, 4),
            "z": round(pos.z, 4),
            "index": i,
        })

    bonds = []
    for bond in mol.GetBonds():
        bonds.append({
            "atom1": bond.GetBeginAtomIdx(),
            "atom2": bond.GetEndAtomIdx(),
            "order": int(bond.GetBondTypeAsDouble()),
        })

    mw = Descriptors.ExactMolWt(mol)
    formula = rdMolDescriptors.CalcMolFormula(mol)

    return {
        "atoms": atoms,
        "bonds": bonds,
        "smiles": canonical_smiles,
        "formula": formula,
        "molecular_weight": round(mw, 4),
        "num_atoms": mol.GetNumAtoms(),
        "num_bonds": len(bonds),
    }


# ===== Unified entry point =====

async def invoke(action: str, payload: dict, context: dict) -> dict:
    """
    Unified entry point for the plugin backend.

    Actions:
        - parse_structure: SMILES/name -> atoms/bonds 3D data + metadata
        - get_info: SMILES/name -> formula, weight, atom/bond counts
        - validate: SMILES/name -> validity check
    """
    smiles_input = payload.get("smiles", "")
    if not isinstance(smiles_input, str) or not smiles_input.strip():
        return {"success": False, "error": "smiles is required"}

    # ---- parse_structure ----
    if action == "parse_structure":
        mol, canonical, err = _parse_molecule(smiles_input)
        if err:
            return {"success": False, "error": err}

        result = _mol_to_atom_bond_data(mol, canonical)
        result["success"] = True
        return result

    # ---- get_info ----
    if action == "get_info":
        mol, canonical, err = _parse_molecule(smiles_input)
        if err:
            return {"success": False, "error": err}

        return {
            "success": True,
            "smiles": canonical,
            "formula": rdMolDescriptors.CalcMolFormula(mol),
            "molecular_weight": round(Descriptors.ExactMolWt(mol), 4),
            "num_atoms": mol.GetNumAtoms(),
            "num_bonds": len(list(mol.GetBonds())),
        }

    # ---- validate ----
    if action == "validate":
        resolved = name_to_smiles(smiles_input)
        if resolved:
            return {
                "valid": True,
                "input": smiles_input,
                "smiles": resolved,
                "type": "name",
            }

        mol = Chem.MolFromSmiles(smiles_input)
        if mol is not None:
            return {
                "valid": True,
                "input": smiles_input,
                "smiles": smiles_input,
                "type": "smiles",
            }

        return {
            "valid": False,
            "input": smiles_input,
            "error": "Not a valid SMILES or known name",
        }

    return {"success": False, "error": f"Unsupported action: {action}"}
