from typing import Literal

from pydantic import BaseModel, Field


NodeStatus = Literal["unknown", "skipped", "review", "learning", "mastered"]
WorkflowMode = Literal["planning", "assessment", "learning", "review", "building"]
NodeAction = Literal["mastered", "review", "assess", "learn", "complete", "skip"]


class ProjectGoal(BaseModel):
    id: str
    conversation_id: str
    raw_input: str
    title: str
    domains: list[str] = Field(default_factory=list)
    artifact_type: str
    difficulty: str
    constraints: dict = Field(default_factory=dict)


class LearningNode(BaseModel):
    id: str
    goal_id: str
    parent_id: str | None = None
    title: str
    description: str
    children: list[str] = Field(default_factory=list)
    prerequisites: list[str] = Field(default_factory=list)
    mastery_criteria: list[str] = Field(default_factory=list)
    estimated_difficulty: Literal["easy", "medium", "hard"]
    status: NodeStatus
    component_hints: list[str] = Field(default_factory=list)
    project_relevance: str


class LearningWorkflowState(BaseModel):
    conversation_id: str
    goal: ProjectGoal
    knowledge_tree: list[LearningNode] = Field(default_factory=list)
    current_node_id: str | None = None
    current_mode: WorkflowMode
    mastered_node_ids: list[str] = Field(default_factory=list)
    weak_node_ids: list[str] = Field(default_factory=list)
    skipped_node_ids: list[str] = Field(default_factory=list)
    project_milestones: list[dict] = Field(default_factory=list)


class CreateGoalRequest(BaseModel):
    raw_input: str
    conversation_id: str | None = None


class GoalCreatedResponse(BaseModel):
    goal: ProjectGoal
    workflow_state: LearningWorkflowState


class TreeResponse(BaseModel):
    goal_id: str
    nodes: list[LearningNode]


class NodeActionRequest(BaseModel):
    conversation_id: str
    action: NodeAction


class SwitchNodeRequest(BaseModel):
    node_id: str


class NodeActionResponse(BaseModel):
    workflow_state: LearningWorkflowState
    integration_feedback: dict | None = None


class ChatMessage(BaseModel):
    role: str
    content: str


class PblChatRequest(BaseModel):
    conversation_id: str
    messages: list[ChatMessage]


# 测评相关模型
class AssessmentQuestion(BaseModel):
    id: str
    type: Literal["multiple_choice", "short_answer"]
    question: str
    options: list[str] = Field(default_factory=list)
    reference_answer: str
    difficulty: Literal["easy", "medium", "hard"]


class Assessment(BaseModel):
    id: str
    node_id: str
    goal_id: str
    questions: list[AssessmentQuestion]
    created_at: str


class AssessmentAttempt(BaseModel):
    id: str
    assessment_id: str
    conversation_id: str
    node_id: str
    user_answers: list[str]
    status: Literal["mastered", "review", "learning"]
    score: float
    reasoning: str
    weak_points: list[str]
    suggestions: list[str]
    created_at: str


class GenerateAssessmentRequest(BaseModel):
    conversation_id: str


class AssessmentResponse(BaseModel):
    assessment: Assessment


class SubmitAssessmentRequest(BaseModel):
    conversation_id: str
    user_answers: list[str]


class JudgmentResponse(BaseModel):
    attempt: AssessmentAttempt
    workflow_state: LearningWorkflowState
