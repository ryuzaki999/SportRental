<template>
  <header class="main-header">
    <nav class="main-header-inner">
      <!-- Branding -->
      <div class="main-header-left">
        <router-link :to="{ name: 'home' }" class="brand">
          <svg class="brand-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="brand-text">SportRental</span>
        </router-link>
      </div>

      <!-- Main Navigation (Desktop) -->
      <div class="nav-center">
        <router-link :to="{ name: 'fields' }" custom v-slot="{ navigate, isActive }">
          <button
            @click="navigate"
            :class="[navLinkBaseClass, isActive ? navLinkActiveClass : navLinkInactiveClass]"
          >
            สนาม
          </button>
        </router-link>
        <router-link :to="{ name: 'bookings' }" custom v-slot="{ navigate, isActive }">
          <button
            @click="navigate"
            :class="[navLinkBaseClass, isActive ? navLinkActiveClass : navLinkInactiveClass]"
          >
            ประวัติการจอง
          </button>
        </router-link>
        <router-link v-if="isAdmin" :to="{ name: 'admin-dashboard' }" custom v-slot="{ navigate, isActive }">
          <button
            @click="navigate"
            :class="[navLinkBaseClass, isActive ? navLinkActiveClass : navLinkInactiveClass]"
          >
            สำหรับเจ้าของสนาม
          </button>
        </router-link>
      </div>

      <!-- User Authentication (Desktop) -->
      <div class="nav-right">
        <template v-if="isLoggedIn">
          <div class="user-pill">
            <span class="user-avatar">
              {{ user.name ? user.name.charAt(0).toUpperCase() : 'U' }}
            </span>
            <span class="user-name">
              {{ user.name }}
            </span>
          </div>
          <button class="ghost-button" @click="logout">
            ออกจากระบบ
          </button>
        </template>
        <template v-else>
          <router-link :to="{ name: 'login' }" class="ghost-link">
            เข้าสู่ระบบ
          </router-link>
          <router-link :to="{ name: 'register' }" class="primary-button">
            สมัครสมาชิก
          </router-link>
        </template>
      </div>

      <!-- Mobile Menu Button -->
      <button class="mobile-toggle" @click="isMobileMenuOpen = !isMobileMenuOpen">
        <svg v-if="!isMobileMenuOpen" class="mobile-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
        <svg v-else class="mobile-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </nav>

    <!-- Mobile Menu -->
    <transition name="fade-down">
      <div v-if="isMobileMenuOpen" class="mobile-menu">
        <div class="mobile-section">
          <router-link :to="{ name: 'fields' }" custom v-slot="{ navigate, isActive }">
            <button
              @click="navigateAndClose(navigate)"
              :class="[mobileNavLinkBaseClass, isActive ? mobileNavLinkActiveClass : mobileNavLinkInactiveClass]"
            >
              สนาม
            </button>
          </router-link>
          <router-link :to="{ name: 'bookings' }" custom v-slot="{ navigate, isActive }">
            <button
              @click="navigateAndClose(navigate)"
              :class="[mobileNavLinkBaseClass, isActive ? mobileNavLinkActiveClass : mobileNavLinkInactiveClass]"
            >
              ประวัติการจอง
            </button>
          </router-link>
          <router-link v-if="isAdmin" :to="{ name: 'admin-dashboard' }" custom v-slot="{ navigate, isActive }">
            <button
              @click="navigateAndClose(navigate)"
              :class="[mobileNavLinkBaseClass, isActive ? mobileNavLinkActiveClass : mobileNavLinkInactiveClass]"
            >
              สำหรับเจ้าของสนาม
            </button>
          </router-link>
        </div>

        <div class="mobile-section border-top">
          <template v-if="isLoggedIn">
            <div class="mobile-user">
              <span class="user-avatar">
                {{ user.name ? user.name.charAt(0).toUpperCase() : 'U' }}
              </span>
              <span class="user-name">
                {{ user.name }}
              </span>
            </div>
            <button
              @click="logout"
              :class="[mobileNavLinkBaseClass, mobileNavLinkInactiveClass]"
            >
              ออกจากระบบ
            </button>
          </template>
          <template v-else>
            <router-link :to="{ name: 'login' }" custom v-slot="{ navigate, isActive }">
              <button
                @click="navigateAndClose(navigate)"
                :class="[mobileNavLinkBaseClass, isActive ? mobileNavLinkActiveClass : mobileNavLinkInactiveClass]"
              >
                เข้าสู่ระบบ
              </button>
            </router-link>
            <router-link :to="{ name: 'register' }" custom v-slot="{ navigate, isActive }">
              <button
                @click="navigateAndClose(navigate)"
                :class="[mobileNavLinkBaseClass, isActive ? mobileNavLinkActiveClass : mobileNavLinkInactiveClass]"
              >
                สมัครสมาชิก
              </button>
            </router-link>
          </template>
        </div>
      </div>
    </transition>
  </header>
</template>

<script>
import { useAuthenStore } from '@/stores/authen'
import { mapState, mapActions } from 'pinia'

export default {
  name: 'MainHeader',
  data() {
    return {
      isMobileMenuOpen: false,
      navLinkBaseClass: 'nav-link',
      navLinkActiveClass: 'nav-link-active',
      navLinkInactiveClass: 'nav-link-inactive',
      mobileNavLinkBaseClass: 'mobile-link',
      mobileNavLinkActiveClass: 'mobile-link-active',
      mobileNavLinkInactiveClass: 'mobile-link-inactive',
    }
  },
  computed: {
    ...mapState(useAuthenStore, {
      isLoggedIn: 'isUserLoggedIn',
      user: 'user'
    }),
    isAdmin() {
      return this.isLoggedIn && this.user && this.user.role === 'admin'
    }
  },
  methods: {
    ...mapActions(useAuthenStore, ['logoutUser']),
    logout() {
      this.closeMenu()
      this.logoutUser()
      this.$router.push({ name: 'home' })
    },
    navigateAndClose(navigate) {
      navigate()
      this.closeMenu()
    },
    closeMenu() {
      this.isMobileMenuOpen = false
    }
  },
  watch: {
    '$route'() {
      // Close mobile menu on route change
      this.isMobileMenuOpen = false
    }
  }
}
</script>

<style scoped>
.main-header {
  position: sticky;
  top: 0;
  z-index: 30;
  background: linear-gradient(to bottom, #0b4fa8, #0b63c5);
  color: #e5f1ff;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.3);
}

.main-header-inner {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0.55rem 1rem;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem;
}

.main-header-left {
  display: flex;
  align-items: center;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding-right: 0.75rem;
  border-right: 1px solid rgba(255, 255, 255, 0.18);
}

.brand-icon {
  width: 26px;
  height: 26px;
  color: #facc15;
}

.brand-text {
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  font-family: 'Plus Jakarta Sans', 'Sarabun', sans-serif;
}

.nav-center {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
}

.nav-link {
  border-radius: 999px;
  padding: 0.45rem 0.9rem;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.008em;
  border: none;
  background: transparent;
  color: #e5f1ff;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.nav-link-inactive:hover {
  background: rgba(15, 23, 42, 0.12);
}

.nav-link-active {
  background: #ffffff;
  color: #0b4fa8;
}

.nav-right {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.5rem;
}

.user-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.28rem 0.6rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.18);
  font-size: 0.8rem;
}

.user-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: #facc15;
  color: #1f2937;
  font-size: 0.75rem;
  font-weight: 700;
}

.user-name {
  max-width: 90px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ghost-button,
.ghost-link {
  border-radius: 999px;
  padding: 0.4rem 0.85rem;
  border: 1px solid rgba(226, 232, 240, 0.4);
  background: transparent;
  color: #e5f1ff;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.ghost-button:hover,
.ghost-link:hover {
  background: rgba(15, 23, 42, 0.18);
  border-color: rgba(226, 232, 240, 0.7);
}

.primary-button {
  border-radius: 999px;
  padding: 0.4rem 0.95rem;
  border: none;
  background: #fde047;
  color: #0b4fa8;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.008em;
  text-decoration: none;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.25);
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.primary-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.32);
  background: #facc15;
}

.mobile-toggle {
  display: none;
  justify-content: center;
  align-items: center;
  border: none;
  background: transparent;
  color: #e5f1ff;
  cursor: pointer;
}

.mobile-icon {
  width: 22px;
  height: 22px;
}

.mobile-menu {
  display: none;
}

.mobile-section {
  padding: 0.5rem 1rem;
}

.border-top {
  border-top: 1px solid rgba(15, 23, 42, 0.25);
}

.mobile-link {
  width: 100%;
  text-align: left;
  border-radius: 0.75rem;
  padding: 0.6rem 0.8rem;
  font-size: 0.9rem;
  font-weight: 600;
  border: none;
  background: transparent;
  color: #e5f1ff;
  cursor: pointer;
  margin-bottom: 0.25rem;
}

.mobile-link-inactive:hover {
  background: rgba(15, 23, 42, 0.2);
}

.mobile-link-active {
  background: rgba(248, 250, 252, 0.98);
  color: #0b4fa8;
}

.mobile-user {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.fade-down-enter-active,
.fade-down-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.fade-down-enter-from,
.fade-down-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 960px) {
  .main-header-inner {
    grid-template-columns: minmax(0, 1.6fr) auto auto;
    gap: 0.75rem;
  }

  .nav-center,
  .nav-right {
    display: none;
  }

  .mobile-toggle {
    display: inline-flex;
  }

  .mobile-menu {
    display: block;
    background: linear-gradient(to bottom, #0b63c5, #0f172a);
  }
}

@media (max-width: 640px) {
  .brand-text {
    display: none;
  }

  .brand {
    padding-right: 0.5rem;
  }
}
</style>
