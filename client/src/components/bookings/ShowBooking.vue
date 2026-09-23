<template>
  <div class="booking-detail-page">
    <div class="booking-card" v-if="booking.id">
      <header class="booking-header">
        <div>
          <p class="booking-label">รายละเอียดการจอง</p>
          <h1 class="booking-title">
            {{ booking.Field ? booking.Field.name : 'การจอง #' + booking.id }}
          </h1>
          <p class="booking-subtitle">
            ผู้จอง:
            <strong>{{ booking.User ? (booking.User.name || booking.User.email) : booking.userId }}</strong>
          </p>
        </div>
        <div class="booking-status">
          <span class="status-pill" :class="'status-' + (booking.status || 'pending')">
            {{ booking.status || 'pending' }}
          </span>
          <button
            v-if="canPay"
            class="pay-btn"
            @click="goToPayment"
          >
            ไปชำระเงิน
          </button>
          <button
            v-if="canCheckin"
            class="primary-btn"
            @click="doCheckin"
            :disabled="loadingCheckin"
          >
            {{ loadingCheckin ? 'กำลังเช็คอิน...' : 'เช็คอิน' }}
          </button>
        </div>
      </header>

      <section class="booking-info">
        <div class="info-column">
          <h2>ข้อมูลสนาม</h2>
          <p>
            <span>สนาม:</span>
            <strong>{{ booking.Field ? booking.Field.name : booking.fieldId }}</strong>
          </p>
          <p v-if="booking.Field && booking.Field.location">
            <span>สถานที่:</span>
            <strong>{{ booking.Field.location }}</strong>
          </p>
        </div>

        <div class="info-column">
          <h2>ช่วงเวลาที่จอง</h2>
          <p>
            <span>เริ่ม:</span>
            <strong>{{ format(booking.startTime) }}</strong>
          </p>
          <p>
            <span>สิ้นสุด:</span>
            <strong>{{ format(booking.endTime) }}</strong>
          </p>
        </div>

        <div class="info-column">
          <h2>ข้อมูลอื่น ๆ</h2>
          <p>
            <span>รหัสการจอง:</span>
            <strong>#{{ booking.id }}</strong>
          </p>
          <p v-if="booking.totalPrice">
            <span>ยอดรวม:</span>
            <strong>{{ booking.totalPrice }} บาท</strong>
          </p>
        </div>
      </section>

      <section
        v-if="booking.equipmentItems && booking.equipmentItems.length"
        class="equipment-section"
      >
        <h2>อุปกรณ์ที่จอง</h2>
        <ul>
          <li v-for="(it, i) in booking.equipmentItems" :key="i">
            <span class="equipment-name">
              {{ equipmentMap[it.equipmentId] || ('#' + it.equipmentId) }}
            </span>
            <span class="equipment-qty">× {{ it.qty }}</span>
          </li>
        </ul>
      </section>

      <section v-if="qr" class="qr-section">
        <h2>QR สำหรับเช็คอิน</h2>
        <p class="qr-helper">
          แสดง QR นี้ให้เจ้าหน้าที่สแกนเมื่อมาถึงสนาม เพื่อยืนยันการเช็คอินของคุณ
        </p>
        <img :src="qr" alt="qr" class="qr-image" />
      </section>

      <div class="actions-row">
        <button class="secondary-btn" @click="$router.push({ name: 'bookings' })">
          ← กลับไปหน้าประวัติการจอง
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import Api from '@/services/Api';
import BookingService from '@/services/BookingService';
import EquipmentService from '@/services/EquipmentService';
import { useAuthenStore } from '@/stores/authen';

export default {
  data() { return { booking: {}, qr: '', equipmentMap: {}, loadingCheckin: false } },
  async created() {
    const id = this.$route.params.bookingId
    try {
      const res = await BookingService.show(id)
      this.booking = res.data || {}
      // fetch qr via API client
      const api = Api()
      const r = await api.get(`booking/${id}/qr`)
      if (r && r.data && r.data.qrCode) this.qr = r.data.qrCode

      // load equipment list and build map
      if (this.booking.equipmentItems && this.booking.equipmentItems.length) {
        try {
          const eq = await EquipmentService.index()
          const list = eq.data || []
          const map = {}
          list.forEach(e => { map[e.id] = e.name })
          this.equipmentMap = map
        } catch (ee) { console.error('Failed to load equipment list', ee) }
      }
    } catch (e) { console.error(e) }
  },
  methods: {
    format (iso) { try { return new Date(iso).toLocaleString('th-TH') } catch (e) { return iso } },
    async doCheckin () {
      if (this.loadingCheckin) return
      const auth = useAuthenStore()
      if (!auth || !auth.token) return alert('ต้องลงชื่อเข้าใช้ก่อน')
      if (!auth.user || auth.user.role !== 'admin') return alert('เฉพาะผู้ดูแลระบบเท่านั้นที่เช็คอินได้')
      try {
        this.loadingCheckin = true
        await BookingService.checkin(this.booking.id)
        // refresh booking and qr
        const res = await BookingService.show(this.booking.id)
        this.booking = res.data || this.booking
        try { const api = Api(); const r = await api.get(`booking/${this.booking.id}/qr`); if (r && r.data && r.data.qrCode) this.qr = r.data.qrCode } catch (e) {}
        alert('เช็คอินสำเร็จ')
      } catch (e) {
        console.error('Checkin failed', e)
        alert(e.response && e.response.data && e.response.data.error ? e.response.data.error : 'เช็คอินล้มเหลว')
      } finally { this.loadingCheckin = false }
    },
    goToPayment () {
      this.$router.push({ name: 'checkout', query: { bookingId: this.booking.id } })
    }
  },
  computed: {
    canPay () {
      const b = this.booking
      if (!b || !b.id) return false
      if (b.paid) return false
      return b.status === 'pending-payment' || b.status === 'pending'
    },
    canCheckin () {
      try {
        const auth = useAuthenStore()
        if (!auth || !auth.user) return false
        if (this.booking.checkedIn) return false
        if (this.booking.status === 'cancelled') return false
        return auth.user.role === 'admin'
      } catch (e) { return false }
    }
  }
}

</script>

<style scoped>
.booking-detail-page {
  padding: 1.5rem 1rem 2.5rem;
}

.booking-card {
  max-width: 840px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 1.5rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12);
  padding: 1.75rem 1.75rem 1.9rem;
}

.booking-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  margin-bottom: 1.4rem;
}

.booking-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #6366f1;
}

.booking-title {
  margin-top: 0.2rem;
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
}

.booking-subtitle {
  margin-top: 0.3rem;
  font-size: 0.9rem;
  color: #4b5563;
}

.booking-status {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  align-items: flex-end;
}

.status-pill {
  border-radius: 999px;
  padding: 0.25rem 0.8rem;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
}

.status-pending,
.status-pending-payment {
  background-color: #fef3c7;
  color: #92400e;
}

.status-confirmed {
  background-color: #d1fae5;
  color: #065f46;
}

.status-checked-in {
  background-color: #e0f2fe;
  color: #075985;
}

.status-cancelled {
  background-color: #fee2e2;
  color: #991b1b;
}

.primary-btn {
  border-radius: 999px;
  padding: 0.45rem 1.1rem;
  border: none;
  background: #22c55e;
  color: #ecfdf5;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.primary-btn[disabled] {
  opacity: 0.7;
  cursor: default;
}

.pay-btn {
  border-radius: 999px;
  padding: 0.45rem 1.1rem;
  border: none;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #fffbeb;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(217, 119, 6, 0.4);
  transition: transform 0.15s ease;
}

.pay-btn:hover {
  transform: translateY(-1px);
}

.booking-info {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  font-size: 0.85rem;
  margin-bottom: 1.1rem;
}

.info-column {
  border-radius: 1rem;
  background: #f9fafb;
  padding: 0.8rem 0.9rem;
}

.info-column h2 {
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.3rem;
}

.info-column p {
  margin: 0.1rem 0;
  color: #4b5563;
}

.info-column span {
  display: inline-block;
  min-width: 72px;
}

.equipment-section {
  margin-bottom: 1.1rem;
}

.equipment-section h2 {
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.4rem;
}

.equipment-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.85rem;
}

.equipment-section li {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
}

.equipment-name {
  color: #111827;
}

.equipment-qty {
  color: #4b5563;
}

.qr-section {
  margin-bottom: 1.1rem;
}

.qr-section h2 {
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
}

.qr-helper {
  margin-top: 0.25rem;
  font-size: 0.82rem;
  color: #6b7280;
}

.qr-image {
  margin-top: 0.6rem;
  max-width: 220px;
  border-radius: 1rem;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
}

.actions-row {
  margin-top: 0.3rem;
  display: flex;
  justify-content: flex-start;
}

.secondary-btn {
  border-radius: 999px;
  padding: 0.45rem 1.1rem;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  color: #374151;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.secondary-btn:hover {
  background: #e5e7eb;
}

@media (max-width: 768px) {
  .booking-card {
    padding-inline: 1.3rem;
  }

  .booking-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .booking-status {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.8rem;
  }

  .booking-info {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
