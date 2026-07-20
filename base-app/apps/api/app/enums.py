from enum import StrEnum


class ProjectStatus(StrEnum):
    PLANNING = "planning"
    IN_DELIVERY = "in_delivery"
    ON_HOLD = "on_hold"
    COMPLETE = "complete"


class RagStatus(StrEnum):
    RED = "red"
    AMBER = "amber"
    GREEN = "green"


class ChangeOrderStatus(StrEnum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"


class CreateChangeOrderStatus(StrEnum):
    """Statuses allowed when creating a change order."""

    DRAFT = "draft"
    SUBMITTED = "submitted"


class BenchmarkPosition(StrEnum):
    BELOW_P25 = "below_p25"
    P25_TO_MEDIAN = "p25_to_median"
    MEDIAN_TO_P75 = "median_to_p75"
    ABOVE_P75 = "above_p75"
