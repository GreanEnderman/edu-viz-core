from dataclasses import dataclass
from typing import Optional


@dataclass
class AtomData:
    element: str
    x: float
    y: float
    z: float
    index: int = 0


@dataclass
class BondData:
    atom1: int
    atom2: int
    order: int = 1


@dataclass
class MoleculeData:
    atoms: list[AtomData]
    bonds: list[BondData]
    smiles: str = ""
    formula: str = ""
    molecular_weight: float = 0.0
    num_atoms: int = 0
    num_bonds: int = 0


@dataclass
class ParseResult:
    success: bool
    molecule: Optional[MoleculeData] = None
    error: str = ""
