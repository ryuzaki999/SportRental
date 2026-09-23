const { Field, Equipment, Booking, User, sequelize } = require('./models')

async function seed() {
  // create missing tables without destructive changes
  await sequelize.sync()

  // try to add `role` column to Users table if it doesn't exist
  try {
    const qi = sequelize.getQueryInterface()
    await qi.addColumn('Users', 'role', { type: require('sequelize').DataTypes.STRING, defaultValue: 'user' })
    console.log('Added role column to Users table')
  } catch (e) {
    // ignore if column already exists or query fails
  }

  // idempotent: only insert fields that don't already exist (safe to re-run seed)
  const fields = [
    { name: 'สนามฟุตบอล ไอ-สปอร์ต', sportType: 'ฟุตบอล', location: 'สุขุมวิท 49', price: '300', capacity: 22, status: 'available', description: 'สนามหญ้าเทียม ขนาด 7 คน', image: '' },
    { name: 'แบดมินตัน เซ็นเตอร์', sportType: 'แบดมินตัน', location: 'ลาดพร้าว', price: '120', capacity: 4, status: 'available', description: 'สนามในร่ม พร้อมไฟ', image: '' }
  ]
  for (const field of fields) {
    const existingField = await Field.findOne({ where: { name: field.name } })
    if (!existingField) {
      await Field.create(field)
      console.log('Field created:', field.name)
    }
  }

  // equipment catalog — idempotent by SKU so re-running seed doesn't duplicate rows
  const equipment = [
    { name: 'ลูกฟุตบอล', sku: 'FB-001', stock: 10, price: '50', condition: 'good', status: 'available', description: 'ลูกฟุตบอลเบอร์ 5' },
    { name: 'ลูกฟุตซอล', sku: 'FZ-001', stock: 8, price: '45', condition: 'good', status: 'available', description: 'ลูกฟุตซอลเบอร์ 4' },
    { name: 'ไม้แบดมินตัน', sku: 'BD-001', stock: 8, price: '40', condition: 'good', status: 'available', description: 'ไม้แบดมินตันน้ำหนักเบา' },
    { name: 'ลูกแบดมินตัน', sku: 'BD-002', stock: 30, price: '25', condition: 'good', status: 'available', description: 'ลูกขนไก่ (ขายเป็นหลอด)' },
    { name: 'ลูกบาสเกตบอล', sku: 'BS-001', stock: 10, price: '60', condition: 'good', status: 'available', description: 'ลูกบาสเบอร์ 7' },
    { name: 'ลูกเทนนิส', sku: 'TN-001', stock: 24, price: '20', condition: 'good', status: 'available', description: 'ลูกเทนนิส 3 ลูก/กระป๋อง' },
    { name: 'ไม้เทนนิส', sku: 'TN-002', stock: 6, price: '80', condition: 'good', status: 'available', description: 'ไม้เทนนิสพร้อมกริป' },
    { name: 'เสื้อบิบแบ่งทีม', sku: 'BI-001', stock: 20, price: '30', condition: 'good', status: 'available', description: 'เสื้อบิบ 2 สี สำหรับแบ่งทีม' }
  ]
  for (const item of equipment) {
    const existingEquipment = await Equipment.findOne({ where: { sku: item.sku } })
    if (!existingEquipment) {
      await Equipment.create(item)
      console.log('Equipment created:', item.name)
    }
  }

  // create admin user if missing
  const adminEmail = 'admin@rental.local'
  const existingAdmin = await User.findOne({ where: { email: adminEmail } })
  if (!existingAdmin) {
    await User.create({ email: adminEmail, password: 'admin123', name: 'Admin', lastname: 'User', role: 'admin', status: 'active' })
    console.log('Admin user created:', adminEmail)
  } else {
    console.log('Admin user already exists:', adminEmail)
  }

  console.log('Seed done')
  process.exit(0)
}

seed().catch(err => { console.error(err); process.exit(1) })
