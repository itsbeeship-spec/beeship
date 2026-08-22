import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Get all warehouses for current user
export const getWarehouses = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const list = await prisma.warehouse.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};

// Add new warehouse
export const addWarehouse = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { 
      name, personName, phone, email, 
      address1, address2, city, state, country, pincode, gstNumber 
    } = req.body;

    if (!name || !personName || !phone || !address1 || !city || !state || !pincode) {
      return res.status(400).json({ 
        success: false, 
        message: "Please fill all mandatory fields (Warehouse Name, Person Name, Phone, Address Line 1, City, State, Pin Code)" 
      });
    }

    // Check if user already has warehouses
    const existingCount = await prisma.warehouse.count({
      where: { userId }
    });

    const isDefault = existingCount === 0; // If first warehouse, set as default

    const created = await prisma.warehouse.create({
      data: {
        name,
        personName,
        phone,
        email: email || null,
        address1,
        address2: address2 || null,
        city,
        state,
        country: country || "India",
        pincode,
        gstNumber: gstNumber || null,
        isDefault,
        userId
      }
    });

    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
};

// Set default warehouse
export const setDefaultWarehouse = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Verify warehouse belongs to user
    const wh = await prisma.warehouse.findFirst({
      where: { id, userId }
    });

    if (!wh) {
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }

    // Set all other warehouses for this user to isDefault = false
    await prisma.warehouse.updateMany({
      where: { userId },
      data: { isDefault: false }
    });

    // Set this one to default
    const updated = await prisma.warehouse.update({
      where: { id },
      data: { isDefault: true }
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// Delete warehouse
export const deleteWarehouse = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Verify warehouse belongs to user
    const wh = await prisma.warehouse.findFirst({
      where: { id, userId }
    });

    if (!wh) {
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }

    // Delete the warehouse
    await prisma.warehouse.delete({
      where: { id }
    });

    // If we deleted the default one, set another one as default (if any left)
    if (wh.isDefault) {
      const nextWh = await prisma.warehouse.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
      if (nextWh) {
        await prisma.warehouse.update({
          where: { id: nextWh.id },
          data: { isDefault: true }
        });
      }
    }

    return res.status(200).json({ success: true, message: "Warehouse deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Update warehouse details
export const updateWarehouse = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { 
      name, personName, phone, email, 
      address1, address2, city, state, country, pincode, gstNumber 
    } = req.body;

    if (!name || !personName || !phone || !address1 || !city || !state || !pincode) {
      return res.status(400).json({ 
        success: false, 
        message: "Please fill all mandatory fields (Warehouse Name, Person Name, Phone, Address Line 1, City, State, Pin Code)" 
      });
    }

    // Verify warehouse belongs to user
    const wh = await prisma.warehouse.findFirst({
      where: { id, userId }
    });

    if (!wh) {
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }

    const updated = await prisma.warehouse.update({
      where: { id },
      data: {
        name,
        personName,
        phone,
        email: email || null,
        address1,
        address2: address2 || null,
        city,
        state,
        country: country || "India",
        pincode,
        gstNumber: gstNumber || null
      }
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};
