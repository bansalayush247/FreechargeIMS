const {
  REPAIR_STATUS,
  REPAIR_OUTCOME,
} = require("../../constants/repair");

const {
  INVENTORY_STATUS,
} = require("../../constants/inventory");

const OPEN_REPAIR_STATUSES = [
  REPAIR_STATUS.OPEN,
  REPAIR_STATUS.SENT_FOR_REPAIR,
  REPAIR_STATUS.IN_PROGRESS,
];

const NON_REPAIRABLE_INVENTORY_STATUSES = [
  INVENTORY_STATUS.LOST,
  INVENTORY_STATUS.RETIRED,
];

const canCreateRepair = (inventoryItem, activeRepair) => {
  if (!inventoryItem || inventoryItem.isDeleted) {
    return {
      allowed: false,
      message: "Inventory item not found",
    };
  }

  if (
    NON_REPAIRABLE_INVENTORY_STATUSES.includes(
      inventoryItem.status
    )
  ) {
    return {
      allowed: false,
      message: "Inventory item cannot be repaired in current status",
    };
  }

  if (activeRepair) {
    return {
      allowed: false,
      message: "Inventory item already has an active repair",
    };
  }

  return {
    allowed: true,
  };
};

const canCompleteRepair = (repair) => {
  if (!repair || repair.isDeleted) {
    return {
      allowed: false,
      message: "Repair request not found",
    };
  }

  if (
    ![
      REPAIR_STATUS.SENT_FOR_REPAIR,
      REPAIR_STATUS.IN_PROGRESS,
    ].includes(repair.status)
  ) {
    return {
      allowed: false,
      message: "Repair request cannot be completed in current status",
    };
  }

  return {
    allowed: true,
  };
};

const canCancelRepair = (repair) => {
  if (!repair || repair.isDeleted) {
    return {
      allowed: false,
      message: "Repair request not found",
    };
  }

  if (
    [
      REPAIR_STATUS.COMPLETED,
      REPAIR_STATUS.CANCELLED,
    ].includes(repair.status)
  ) {
    return {
      allowed: false,
      message: "Repair request cannot be cancelled",
    };
  }

  return {
    allowed: true,
  };
};

const getTransactionTypeForOutcome = (
  outcome,
  transactionTypes
) => {
  if (outcome === REPAIR_OUTCOME.FIXED) {
    return transactionTypes.REPAIR_COMPLETED;
  }

  if (outcome === REPAIR_OUTCOME.DISPOSED) {
    return transactionTypes.RETIRED;
  }

  return transactionTypes.DAMAGED;
};

module.exports = {
  OPEN_REPAIR_STATUSES,
  canCreateRepair,
  canCompleteRepair,
  canCancelRepair,
  getTransactionTypeForOutcome,
};


