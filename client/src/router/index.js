import { useAuthenStore } from '@/stores/authen'
import { createRouter, createWebHistory } from 'vue-router'

// ===== Landing =====
import HomeView from '../views/HomeView.vue'

// ===== Users =====
import UserCreate from '../components/Users/CreateUser.vue'
import UserEdit from '../components/Users/EditUser.vue'
import UserIndex from '../components/Users/Index.vue'
import UserShow from '../components/Users/ShowUser.vue'

// ===== Fields =====
import FieldCreate from '../components/fields/CreateField.vue'
import FieldEdit from '../components/fields/EditField.vue'
import FieldIndex from '../components/fields/index.vue'
import FieldShow from '../components/fields/ShowField.vue'
// ===== Equipment =====
import EquipmentIndex from '../components/equipment/index.vue'

// ===== Orders (เพิ่มตามโจทย์) =====
// import OrderIndex from '../components/Orders/Index.vue'

// ===== Blogs (ตามอาจารย์) =====
// import BlogCreate from '../components/Blogs/CreateBlog.vue'
// import BlogEdit from '../components/Blogs/EditBlog.vue'
// import BlogIndex from '../components/Blogs/Index.vue'
// import BlogShow from '../components/Blogs/ShowBlog.vue'

// ===== Auth =====
import Login from '../components/Users/Login.vue'
import Register from '../components/Users/Register.vue'
// ===== Bookings =====
import BookingCreate from '../components/bookings/CreateBooking.vue'
import BookingIndex from '../components/bookings/Index.vue'
import BookingShow from '../components/bookings/ShowBooking.vue'
// ===== Admin =====
import AdminDashboard from '../components/admin/AdminDashboard.vue'

import Checkout from '../components/bookings/Checkout.vue'
import BookingConfirmation from '../components/bookings/Confirmation.vue'
import MockPayment from '../components/bookings/MockPayment.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    // ---------- User Routes ----------
    // {
    //   path: '/users',
    //   name: 'users',
    //   component: UserIndex
    // },
    // {
    //   path: '/user/create',
    //   name: 'user-create',
    //   component: UserCreate
    // },
    // {
    //   path: '/user/edit/:userId',
    //   name: 'user-edit',
    //   component: UserEdit
    // },
    {
      path: '/users',
      name: 'users',
      component: UserIndex
    },
    {
      path: '/user/create',
      name: 'user-create',
      component: UserCreate
    },
    {
      path: '/user/edit/:userId',
      name: 'user-edit',
      component: UserEdit
    },
    {
      path: '/user/:userId',
      name: 'user-show',
      component: UserShow
    },

    // ---------- Booking Routes ----------
    {
      path: '/bookings',
      name: 'bookings',
      component: BookingIndex,
      meta: { requiresAuth: true }
    },
    {
      path: '/booking/create',
      name: 'booking-create',
      component: BookingCreate,
      meta: { requiresAuth: true }
    },
    {
      path: '/booking/:bookingId',
      name: 'booking-show',
      component: BookingShow,
      meta: { requiresAuth: true }
    },
    {
      path: '/checkout',
      name: 'checkout',
      component: Checkout,
      meta: { requiresAuth: true }
    },
    {
      path: '/mock-payment',
      name: 'mock-payment',
      component: MockPayment,
      meta: { requiresAuth: true }
    },
    {
      path: '/booking/confirmation',
      name: 'booking-confirmation',
      component: BookingConfirmation,
      meta: { requiresAuth: true }
    },

    // ---------- Field Routes ----------
    {
      path: '/fields',
      name: 'fields',
      component: FieldIndex
    },
    {
      path: '/field/create',
      name: 'field-create',
      component: FieldCreate,
      meta: { requiresAdmin: true }
    },
    {
      path: '/field/edit/:fieldId',
      name: 'field-edit',
      component: FieldEdit,
      meta: { requiresAdmin: true }
    },
    {
      path: '/field/:fieldId',
      name: 'field-show',
      component: FieldShow
    },

    // ---------- Equipment Routes ----------
    {
      path: '/equipment',
      name: 'equipment',
      component: EquipmentIndex
    },

    // ---------- Order Routes (Lab 10) ----------
    // {
    //   path: '/orders',
    //   name: 'orders',
    //   component: OrderIndex
    // },

    // ---------- Blog Routes ----------
    // {
    //   path: '/blogs',
    //   name: 'blogs',
    //   component: BlogIndex
    // },
    // {
    //   path: '/blog/create',
    //   name: 'blog-create',
    //   component: BlogCreate
    // },
    // {
    //   path: '/blog/edit/:blogId',
    //   name: 'blog-edit',
    //   component: BlogEdit
    // },
    // {
    //   path: '/blog/:blogId',
    //   name: 'blog-show',
    //   component: BlogShow
    // },

    // ---------- Auth ----------
    {
      path: '/login',
      name: 'login',
      component: Login
    },
    {
      path: '/register',
      name: 'register',
      component: Register
    },
    {
      path: '/admin',
      name: 'admin-dashboard',
      component: AdminDashboard,
      meta: { requiresAdmin: true }
    }
  ]
})

router.beforeEach((to, from, next) => {
  try {
    const auth = useAuthenStore()
    const token = auth && auth.token
    const user = auth && auth.user

    if (to.meta && to.meta.requiresAuth && !token) {
      return next({ name: 'login', query: { redirect: to.fullPath } })
    }

    if (to.meta && to.meta.requiresAdmin) {
      if (!token || !user || user.role !== 'admin') {
        return next({ name: 'login', query: { redirect: to.fullPath } })
      }
    }

    return next()
  } catch (e) {
    console.error('Auth check failed', e)
    if (to.meta && (to.meta.requiresAuth || to.meta.requiresAdmin)) {
      return next({ name: 'login', query: { redirect: to.fullPath } })
    }
    return next()
  }
})

export default router
