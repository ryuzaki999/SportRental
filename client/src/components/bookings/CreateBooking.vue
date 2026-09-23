<template>
  <div class="booking-page">
    <div class="booking-card">
      <header class="booking-header">
        <h1 class="booking-title">จองสนาม</h1>
        <p class="booking-subtitle">
          เลือกช่วงเวลาและอุปกรณ์เสริมที่ต้องการ จากนั้นยืนยันเพื่อสร้างการจอง
        </p>
      </header>

      <form class="booking-form" @submit.prevent="createBooking">
        <div class="section">
          <label class="field">
            <span class="field-label">สนามที่เลือก</span>
            <div class="field-display">
              <span class="field-name">
                {{ fieldName || ('สนาม #' + routeFieldId) }}
              </span>
              <span v-if="!fieldName" class="field-hint">
                (ระบุจากหน้าแสดงสนาม หรือผ่านลิงก์จอง)
              </span>
            </div>
          </label>
        </div>

        <div class="section grid-2">
          <label class="field">
            <span class="field-label">เวลาเริ่มต้น</span>
            <input
              type="datetime-local"
              v-model="booking.startTime"
              required
              class="field-input"
            />
          </label>

          <label class="field">
            <span class="field-label">เวลาสิ้นสุด</span>
            <input
              type="datetime-local"
              v-model="booking.endTime"
              required
              class="field-input"
            />
          </label>
        </div>

        <section class="section">
          <div class="section-header">
            <h2 class="section-title">อุปกรณ์เสริม (ถ้ามี)</h2>
            <button class="chip-button" type="button" @click.prevent="addItem">
              + เพิ่มอุปกรณ์
            </button>
          </div>

          <div
            v-if="equipmentItems.length === 0"
            class="equipment-empty"
          >
            ยังไม่ได้เลือกอุปกรณ์เสริม คุณสามารถกดปุ่ม
            <span class="inline-chip">+ เพิ่มอุปกรณ์</span>
            เพื่อเพิ่มรายการได้
          </div>

          <div
            v-for="(it, idx) in equipmentItems"
            :key="idx"
            class="equipment-row"
          >
            <select
              v-model.number="it.equipmentId"
              class="field-input equipment-select"
            >
              <option :value="null">-- เลือกอุปกรณ์ --</option>
              <option
                v-for="e in equipmentOptions"
                :key="e.id"
                :value="e.id"
              >
                {{ e.name }} (คงเหลือ {{ e.stock }})
              </option>
            </select>
            <input
              type="number"
              v-model.number="it.qty"
              placeholder="จำนวน"
              min="1"
              class="field-input qty-input"
            />
            <button
              class="ghost-chip"
              @click.prevent="removeItem(idx)"
            >
              ลบ
            </button>
          </div>
        </section>

        <div class="actions">
          <button type="button" class="secondary-button" @click="$router.back()">
            ยกเลิก
          </button>
          <button type="submit" class="primary-button" :disabled="submitting">
            {{ submitting ? 'กำลังสร้างการจอง...' : 'ยืนยันการจอง' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import BookingService from '@/services/BookingService';
import EquipmentService from '@/services/EquipmentService';
import FieldService from '@/services/FieldService';

export default {
  data () {
    return {
      booking: {
        fieldId: null,
        startTime: '',
        endTime: '',
        equipmentItems: []
      },
      equipmentItems: [],
      equipmentOptions: [],
      fieldName: '',
      routeFieldId: null,
      submitting: false
    }
  },
  async created () {
    // allow preselect via query param ?fieldId=123
    const q = this.$route.query
    if (q && q.fieldId) {
      this.booking.fieldId = parseInt(q.fieldId)
      this.routeFieldId = this.booking.fieldId
      try {
        const res = await FieldService.show(this.booking.fieldId)
        this.fieldName = res.data && res.data.name
      } catch (e) { }
    }
    // prefill start/end if provided as ISO in query (?start=&end=)
    if (q && q.start) {
      this.booking.startTime = this.isoToDatetimeLocal(q.start)
    }
    if (q && q.end) {
      this.booking.endTime = this.isoToDatetimeLocal(q.end)
    }
    // load equipment options
    try {
      const r = await EquipmentService.index()
      this.equipmentOptions = r.data || []
    } catch (e) { console.error('Failed to load equipment', e) }
  },
  methods: {
    addItem () {
      this.equipmentItems.push({ equipmentId: null, qty: 1 })
    },
    removeItem (idx) {
      this.equipmentItems.splice(idx, 1)
    },
    async createBooking () {
      try {
        if (!this.booking.fieldId) {
          alert('กรุณาเลือกสนามก่อนทำรายการ')
          return
        }
        const start = new Date(this.booking.startTime)
        const end = new Date(this.booking.endTime)
        if (isNaN(start) || isNaN(end) || end <= start) {
          alert('กรุณาระบุเวลาเริ่มและเวลาสิ้นสุดให้ถูกต้อง')
          return
        }
        this.submitting = true
        const payload = Object.assign({}, this.booking)
        payload.equipmentItems = this.equipmentItems
          .map((it) => ({ equipmentId: parseInt(it.equipmentId), qty: parseInt(it.qty) }))
          .filter((it) => Number.isInteger(it.equipmentId) && it.equipmentId > 0 && Number.isInteger(it.qty) && it.qty > 0)
        payload.status = 'pending-payment'
        // convert datetime-local to ISO
        if (payload.startTime) payload.startTime = new Date(payload.startTime).toISOString()
        if (payload.endTime) payload.endTime = new Date(payload.endTime).toISOString()
        const res = await BookingService.post(payload)
        // สร้างการจองสำเร็จ → พาไปหน้าชำระเงิน (checkout) พร้อมเลขที่การจอง
        const bookingId = res && res.data && res.data.id
        if (bookingId) {
          this.$router.push({ name: 'checkout', query: { bookingId } })
        } else {
          this.$router.push({ name: 'bookings' })
        }
      } catch (err) {
        console.error(err)
        alert(err.response && err.response.data && err.response.data.error ? err.response.data.error : 'Booking failed')
      } finally {
        this.submitting = false
      }
    }
    ,
    isoToDatetimeLocal(iso) {
      try {
        const d = new Date(iso)
        const pad = (n) => String(n).padStart(2, '0')
        const yyyy = d.getFullYear()
        const mm = pad(d.getMonth() + 1)
        const dd = pad(d.getDate())
        const hh = pad(d.getHours())
        const min = pad(d.getMinutes())
        return `${yyyy}-${mm}-${dd}T${hh}:${min}`
      } catch (e) { return iso }
    }
  }
}
</script>

<style scoped>
.booking-page {
  padding: 1.5rem 1rem 2.5rem;
}

.booking-card {
  max-width: 800px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 1.5rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.15);
  padding: 1.75rem 1.75rem 1.9rem;
}

.booking-header {
  margin-bottom: 1.25rem;
}

.booking-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: #0f172a;
}

.booking-subtitle {
  margin-top: 0.25rem;
  font-size: 0.9rem;
  color: #6b7280;
}

.booking-form {
  display: grid;
  gap: 1.25rem;
}

.section {
  border-radius: 1rem;
  background: #f9fafb;
  padding: 1.1rem 1rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.6rem;
}

.section-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
}

.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.field {
  display: grid;
  gap: 0.3rem;
}

.field-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #4b5563;
}

.field-input {
  border-radius: 0.9rem;
  border: 1px solid #d1d5db;
  padding: 0.55rem 0.8rem;
  font-size: 0.9rem;
  color: #111827;
  width: 100%;
}

.field-input:focus-visible {
  outline: 2px solid #0ea5e9;
  outline-offset: 1px;
  border-color: #0ea5e9;
}

.field-display {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem;
}

.field-name {
  font-weight: 600;
  color: #111827;
}

.field-hint {
  font-size: 0.8rem;
  color: #6b7280;
}

.chip-button {
  border-radius: 999px;
  border: none;
  padding: 0.35rem 0.9rem;
  font-size: 0.8rem;
  font-weight: 600;
  background: #e0f2fe;
  color: #0369a1;
  cursor: pointer;
}

.chip-button:hover {
  background: #bae6fd;
}

.inline-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.1rem 0.45rem;
  background: #eef2ff;
  color: #4f46e5;
  font-size: 0.8rem;
}

.equipment-empty {
  font-size: 0.85rem;
  color: #6b7280;
}

.equipment-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.equipment-select {
  flex: 1 1 220px;
}

.qty-input {
  flex: 0 0 90px;
}

.ghost-chip {
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.ghost-chip:hover {
  background: #f3f4f6;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 0.25rem;
}

.primary-button,
.secondary-button {
  border-radius: 999px;
  padding: 0.55rem 1.15rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
}

.secondary-button {
  background: #f3f4f6;
  color: #374151;
}

.secondary-button:hover {
  background: #e5e7eb;
}

.primary-button {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #ecfdf5;
  box-shadow: 0 12px 30px rgba(22, 163, 74, 0.6);
}

.primary-button:hover {
  background: linear-gradient(135deg, #16a34a, #15803d);
}

.primary-button:disabled {
  cursor: not-allowed;
  opacity: 0.72;
  box-shadow: none;
}

@media (max-width: 640px) {
  .booking-card {
    padding-inline: 1.25rem;
  }

  .grid-2 {
    grid-template-columns: minmax(0, 1fr);
  }

  .actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .primary-button,
  .secondary-button {
    width: 100%;
    text-align: center;
  }
}
</style>
