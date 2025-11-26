<template>
  <div>
    <!-- Header -->
    <header class="header">
      <button class=" menu-btn " @click="toggleMobileMenu">
        Menu
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none"
          viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
       <!-- <div class="logo" @click="toggleCollapse">
          <img src="/src/assets/chec2.png" alt="VehiculeApp Logo" />
        </div> -->
      <!-- Message centré -->
 <div class="header-title">
  <span class="welcome-text">Bienvenue,</span>

   <div class="user-info">
    <img 
      :src="user.avatar || defaultAvatar"
      width="40" height="40"
      class="rounded-circle border"
    />
    <span class="username">{{ user.name }}</span>
  </div>
</div>

      <button class="logout-btn " @click="logout">Déconnexion</button>
    </header>

    <!-- Overlay mobile -->
    <div
      class="mobile-overlay"
      v-if="isMobileMenuOpen"
      @click="toggleMobileMenu"
    ></div>

    <!-- Sidebar -->
    <aside :class="['sidebar', { 'sidebar-collapsed': isCollapsed, 'sidebar-mobile-open': isMobileMenuOpen }]">
      <div class="sidebar-header">
       
        <button class="logo" @click="toggleCollapse">
          <img src="/src/assets/chec2.png" alt="VehiculeApp Logo" />

          <!--  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none"
            viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 5l7 7-7 7" /> 
          </svg>-->
        </button>
      </div>

      <ul class="sidebar-menu">
         <li v-if="user && user.role === 'admin'">  
          <router-link to="/header/dashboard" exact>
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none"
              viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span v-if="!isCollapsed">Tableau de bord</span>
          </router-link>
        </li>
        <li>
          <router-link to="/header/vehicules" exact>
            <TruckIcon class="icon" />
            <span v-if="!isCollapsed">Véhicules</span>
          </router-link>
        </li>
        <li>
          <router-link to="/header/drivers" exact>
            <UserIcon class="icon" />
            <span v-if="!isCollapsed">Chauffeurs</span>
          </router-link>
        </li>
        <li>
          <router-link to="/header/lavages" exact>
            <SparklesIcon class="icon" />
            <span v-if="!isCollapsed">Lavages</span>
          </router-link>
        </li>
        <li>
          <router-link to="/header/entretiens" exact>
            <WrenchIcon class="icon" />
            <span v-if="!isCollapsed">Entretiens</span>
          </router-link>
        </li>
      <li v-if="user && user.role === 'admin'">
        <router-link to="/header/register" exact>
          <UserIcon class="icon" />
          <span v-if="!isCollapsed">Utilisateurs</span>
        </router-link>
      </li>

      </ul>
    </aside>

    <!-- Main content -->
    <main :class="['main-content', { 'main-collapsed': isCollapsed }]">
      <router-view />
    </main>
  </div>
</template>

<script>
import api from "../api.js";
import { TruckIcon, UserIcon, SparklesIcon, WrenchIcon } from '@heroicons/vue/24/outline'

export default {
  name: "HeaderSidebarModern",
  components: { TruckIcon, UserIcon, SparklesIcon, WrenchIcon },
  data() {
    return {
      user: {},
      defaultAvatar: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
      isCollapsed: false,
      isMobileMenuOpen: false,
    }
  },
  mounted() {
    this.getUser();
  },
  methods: {
    toggleCollapse() {
      this.isCollapsed = !this.isCollapsed;
    },
    toggleMobileMenu() {
      this.isMobileMenuOpen = !this.isMobileMenuOpen;
    },
    async getUser() {
      try {
        const res = await api.get("/me");
        this.user = res.data;
      } catch (err) {
        console.error("Impossible de récupérer l'utilisateur", err);
        this.$router.push("/login");
      }
    },
    async logout() {
      const confirmed = window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?");
      if (!confirmed) return;
      try {
        await api.post("/logout");
        localStorage.removeItem("auth_token");
        this.$router.push("/login");
      } catch (err) {
        console.error("Erreur lors de la déconnexion", err);
      }
    }
  }
}
</script>

<style scoped>


.welcome-text {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 5px;
}

.user-info {
  align-items: center;
  gap: 10px;
}
.username {
  font-weight: bold;
  font-size: 18px;
  font-weight: 500;
}

/* Header */

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 80px;
  background:white;
  color: blue;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 300;
}

.menu-btn {
  background: none;
  border: none;
  color: #1e1c9e; 
  cursor: pointer;
  display: none;
}

.logout-btn {
  font-weight: bold;
  background:#1e1c9e;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  color: white;
}

/* Centrer le message */
.header-title {
  font-weight: bold;
  font-size: 18px;
  text-align: center;
  flex: 1;
}

/* Sidebar */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 220px;
  height: 100%;
  background:  white;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  transition: width 0.3s ease, transform 0.3s ease;
  z-index: 999;
  padding-top: 60px;
}

.sidebar-collapsed {
  width: 50px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
}

.logo img {
  width: 80px; /* réduit le logo */
  height: auto;
  border: none;
  padding: 8px 12px;
  border-radius: 10px;
}

/* Menu */
.sidebar-menu {
  list-style: none;
  padding: 0;
}

.sidebar-menu li {
  margin: 10px 0;
}

.sidebar a {
  color: #1e1c9e;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
}

.icon {
  width: 40px;
  height: 50px;
}

/* Main content */
.main-content {
  margin-left: 220px;
  padding: 80px 20px 20px 20px;
  transition: margin-left 0.3s ease;
  background: #1e1c9e;
}

.main-collapsed {
  margin-left: 80px;
  
}

/* Mobile Styles */
@media (max-width: 768px) {
  .menu-btn {
    display: block;
  }

  .sidebar {
    transform: translateX(-100%);
    width: 220px;
    padding-top: 60px;
    top: 0;
    height: 100%;
  }

  .sidebar.sidebar-mobile-open {
    transform: translateX(0);
  }

  .main-content {
    margin-left: 0;
    padding-top: 70px;
  }

  .mobile-overlay {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.4);
    z-index: 998;
  }
}
</style>
