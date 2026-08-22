import prisma from '../config/db.js';

// ─── Helper: get IP from request ─────────────────────────────────────────────
function getIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    null
  );
}

// ─── Log an action (called internally from other controllers) ─────────────────
export async function logActivity({
  adminId,
  adminName,
  adminRole,
  module,
  action,
  targetId = null,
  targetLabel = null,
  severity = 'INFO',
  description = null,
  changes = null,
  ipAddress = null,
  userAgent = null,
}) {
  try {
    await prisma.activityLog.create({
      data: {
        adminId,
        adminName,
        adminRole,
        module,
        action,
        targetId,
        targetLabel,
        severity,
        description,
        changes,
        ipAddress,
        userAgent,
      },
    });
  } catch (err) {
    // Never throw — logging should never break main flow
    console.error('[ActivityLog] Failed to log:', err.message);
  }
}

// ─── GET /admin/activity-logs ─────────────────────────────────────────────────
export const listActivityLogs = async (req, res, next) => {
  try {
    const {
      search = '',
      module: moduleFilter,
      action: actionFilter,
      severity: severityFilter,
      adminId: adminFilter,
      startDate,
      endDate,
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum  = Math.max(parseInt(page,  10) || 1, 1);
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
    const skip     = (pageNum - 1) * limitNum;

    const where = {};

    // Date range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate)   where.createdAt.lte = new Date(endDate);
    }

    // Module filter
    if (moduleFilter && moduleFilter !== 'all') {
      where.module = moduleFilter;
    }

    // Action filter
    if (actionFilter && actionFilter !== 'all') {
      where.action = actionFilter;
    }

    // Severity filter
    if (severityFilter && severityFilter !== 'all') {
      where.severity = severityFilter;
    }

    // Admin filter
    if (adminFilter && adminFilter !== 'all') {
      where.adminId = adminFilter;
    }

    // Search (admin name, action, targetLabel, description)
    if (search.trim()) {
      where.OR = [
        { adminName:   { contains: search, mode: 'insensitive' } },
        { action:      { contains: search, mode: 'insensitive' } },
        { targetLabel: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { module:      { contains: search, mode: 'insensitive' } },
      ];
    }

    // Parallel: logs + count + stats
    const [logs, totalCount, statsRaw] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          admin: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      prisma.activityLog.count({ where }),

      // Stats (total, today, critical, failed) — always unfiltered for overview
      Promise.all([
        prisma.activityLog.count(),
        prisma.activityLog.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        prisma.activityLog.count({ where: { severity: 'CRITICAL' } }),
        prisma.activityLog.count({ where: { severity: 'FAILED' } }),
      ]),
    ]);

    const [total, today, critical, failed] = statsRaw;

    return res.json({
      logs,
      pagination: {
        totalCount,
        currentPage: pageNum,
        totalPages:  Math.ceil(totalCount / limitNum),
        limit:       limitNum,
      },
      stats: { total, today, critical, failed },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /admin/activity-logs/:id ─────────────────────────────────────────────
export const getActivityLog = async (req, res, next) => {
  try {
    const { id } = req.params;

    const log = await prisma.activityLog.findUnique({
      where: { id },
      include: {
        admin: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!log) return res.status(404).json({ message: 'Log not found' });

    return res.json({ log });
  } catch (err) {
    next(err);
  }
};

// ─── GET /admin/activity-logs/filters ─────────────────────────────────────────
// Returns unique modules, actions, admins for filter dropdowns
export const getActivityLogFilters = async (req, res, next) => {
  try {
    const [modules, actions, admins] = await Promise.all([
      prisma.activityLog.findMany({
        distinct: ['module'],
        select: { module: true },
        orderBy: { module: 'asc' },
      }),
      prisma.activityLog.findMany({
        distinct: ['action'],
        select: { action: true },
        orderBy: { action: 'asc' },
      }),
      prisma.activityLog.findMany({
        distinct: ['adminId'],
        select: { adminId: true, adminName: true, adminRole: true },
        orderBy: { adminName: 'asc' },
      }),
    ]);

    return res.json({
      modules: modules.map((m) => m.module),
      actions: actions.map((a) => a.action),
      admins:  admins.map((a) => ({ id: a.adminId, name: a.adminName, role: a.adminRole })),
    });
  } catch (err) {
    next(err);
  }
};
