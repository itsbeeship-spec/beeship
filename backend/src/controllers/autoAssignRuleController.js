import prisma from '../config/db.js';

// Get all rules for current user
export const getRules = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const rules = await prisma.autoAssignRule.findMany({
      where: { userId },
      orderBy: { priority: 'asc' }
    });
    return res.status(200).json({ success: true, data: rules });
  } catch (error) {
    next(error);
  }
};

// Create a new rule
export const createRule = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, priority, enabled, conditionsJoin, configurations, priorities } = req.body;

    if (!name || priority === undefined || !configurations || !priorities) {
      return res.status(400).json({
        success: false,
        message: "Please fill all mandatory fields (Rule Name, Priority Level, Configurations, Priorities)"
      });
    }

    const created = await prisma.autoAssignRule.create({
      data: {
        name,
        priority: parseInt(priority, 10),
        enabled: enabled !== undefined ? enabled : true,
        conditionsJoin: conditionsJoin || "AND",
        configurations, // Stored directly as Json
        priorities,     // Stored directly as Json
        userId
      }
    });

    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
};

// Update a rule
export const updateRule = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, priority, enabled, conditionsJoin, configurations, priorities } = req.body;

    // Verify ownership
    const existing = await prisma.autoAssignRule.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Rule not found" });
    }

    const updated = await prisma.autoAssignRule.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        priority: priority !== undefined ? parseInt(priority, 10) : existing.priority,
        enabled: enabled !== undefined ? enabled : existing.enabled,
        conditionsJoin: conditionsJoin !== undefined ? conditionsJoin : existing.conditionsJoin,
        configurations: configurations !== undefined ? configurations : existing.configurations,
        priorities: priorities !== undefined ? priorities : existing.priorities
      }
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// Toggle rule enabled status
export const toggleRule = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Verify ownership
    const existing = await prisma.autoAssignRule.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Rule not found" });
    }

    const updated = await prisma.autoAssignRule.update({
      where: { id },
      data: {
        enabled: !existing.enabled
      }
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// Delete a rule
export const deleteRule = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Verify ownership
    const existing = await prisma.autoAssignRule.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Rule not found" });
    }

    await prisma.autoAssignRule.delete({
      where: { id }
    });

    return res.status(200).json({ success: true, message: "Rule deleted successfully" });
  } catch (error) {
    next(error);
  }
};
