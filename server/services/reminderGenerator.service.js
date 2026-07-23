const Reminder = require('../models/Reminder.model');
const Vehicle  = require('../models/Vehicle.model');

// Helper to format vehicle name
const vehicleTitle = (v) => `${v.brand || ''} ${v.model || ''} (${v.registrationNumber || ''})`.trim();

/**
 * Automatically syncs reminders for a vehicle's compliance dates (Insurance, PUC, Warranty, Service).
 */
const syncVehicleReminders = async (vehicleId) => {
  try {
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return;

    const vName = vehicleTitle(vehicle);
    const userId = vehicle.owner;

    const syncTypes = [
      {
        type: 'Insurance',
        date: vehicle.insuranceExpiry,
        title: `Insurance Renewal — ${vName}`,
        description: `Vehicle insurance for ${vName} is due for renewal.`,
        priority: 'High',
      },
      {
        type: 'PUC',
        date: vehicle.pucExpiry,
        title: `PUC Certificate Expiry — ${vName}`,
        description: `Pollution Under Control (PUC) certificate for ${vName} is expiring.`,
        priority: 'High',
      },
      {
        type: 'Warranty',
        date: vehicle.warrantyExpiry,
        title: `Warranty Expiry — ${vName}`,
        description: `Manufacturer/extended warranty for ${vName} is ending.`,
        priority: 'Low',
      },
      {
        type: 'Service',
        date: vehicle.nextServiceDate,
        title: `Scheduled Service Due — ${vName}`,
        description: `Routine maintenance service for ${vName} is due.`,
        priority: 'Medium',
      },
    ];

    for (const item of syncTypes) {
      if (!item.date) continue;

      const dueDate = new Date(item.date);

      // Check if a pending/overdue reminder already exists for this vehicle & type
      const existing = await Reminder.findOne({
        user: userId,
        vehicle: vehicleId,
        reminderType: item.type,
        status: { $in: ['Pending', 'Overdue'] },
      });

      if (existing) {
        existing.dueDate = dueDate;
        existing.title = item.title;
        existing.description = item.description;
        // Determine status based on current time
        existing.status = dueDate.getTime() < Date.now() ? 'Overdue' : 'Pending';
        await existing.save();
      } else {
        const isOverdue = dueDate.getTime() < Date.now();
        await Reminder.create({
          user: userId,
          vehicle: vehicleId,
          reminderType: item.type,
          title: item.title,
          description: item.description,
          dueDate,
          priority: item.priority,
          status: isOverdue ? 'Overdue' : 'Pending',
        });
      }
    }
  } catch (err) {
    console.warn('[reminderGenerator] Failed to sync vehicle reminders:', err.message);
  }
};

/**
 * Background job to check overdue reminders.
 */
const checkAndMarkOverdueReminders = async () => {
  try {
    const now = new Date();
    const result = await Reminder.updateMany(
      {
        status: 'Pending',
        dueDate: { $lt: now },
      },
      {
        $set: { status: 'Overdue' },
      }
    );
    if (result.modifiedCount > 0) {
      console.log(`[reminderGenerator] Updated ${result.modifiedCount} reminders to Overdue status`);
    }
  } catch (err) {
    console.warn('[reminderGenerator] Overdue check failed:', err.message);
  }
};

module.exports = {
  syncVehicleReminders,
  checkAndMarkOverdueReminders,
};
