

<template>
  <div>
    <!-- Header -->
    <header class="header">
      <button class="menu-btn" @click="toggleMobileMenu">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none"
          viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div class="header-title">Bienvenue, {{ user.name }}</div>
      <button class="logout-btn" @click="logout">Déconnexion</button>
    </header>

    <!-- Overlay mobile -->
    <div
      class="mobile-overlay"
      v-if="isMobileMenuOpen"
      @click="toggleMobileMenu"
    ></div>

    <!-- Sidebar -->
    <aside :class="['sidebar', { 'sidebar-mobile-open': isMobileMenuOpen }]">
      <div class="sidebar-header">
        <div class="logo">
          <img src="/src/assets/chec2.png" alt="VehiculeApp Logo" />
        </div>
      </div>

      <ul>
        <li>
          <router-link to="/header/vehicules" exact>
            <TruckIcon class="icon" /> Véhicules
          </router-link>
        </li>
        <li>
          <router-link to="/header/drivers" exact>
            <UserIcon class="icon" /> Chauffeurs
          </router-link>
        </li>
        <li>
          <router-link to="/header/lavages" exact>
            <SparklesIcon class="icon" /> Lavages
          </router-link>
        </li>
        <li>
          <router-link to="/header/entretiens" exact>
            <WrenchIcon class="icon" /> Entretiens
          </router-link>
        </li>
      </ul>

      <button class="logout-button" @click="logout">Déconnexion</button>
    </aside>

    <!-- Content -->
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script>
import api from "../api.js";
import { TruckIcon, UserIcon, SparklesIcon, WrenchIcon } from '@heroicons/vue/24/outline'

export default {
  name: 'HeaderSidebar',
  components: { TruckIcon, UserIcon, SparklesIcon, WrenchIcon },
  data() {
    return {
      user: {},
      isMobileMenuOpen: false,
    }
  },
 mounted() {
    // Récupérer l'utilisateur dès que le composant est monté
    this.getUser();
  },

  methods: {
    toggleMobileMenu() {
      this.isMobileMenuOpen = !this.isMobileMenuOpen;
    },

    async getUser() {
      try {
        const res = await api.get("/me");
        this.user = res.data;
      } catch (err) {
        console.error("Impossible de récupérer l'utilisateur", err);
        // Rediriger vers login si erreur (ex: token expiré)
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
/* Header */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
  background: #667eea;
  color: white;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 300;
}

.menu-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  display: none;
}

.logout-btn {
  background: #0c21db;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
}

.header-title {
  text-align: center;
  font-weight: bold;
  font-size: 18px;
}

/* Sidebar */
.sidebar {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100vh;
  padding: 20px;
  background: #667eea;
  color: white;
  transition: transform 0.3s ease;
  position: fixed;
  left: 0;
  top: 60px;
  width: 220px;
  z-index: 200;
}

.sidebar-header {
  display: flex;
  justify-content: center;
  align-items: center;
}

.logo img {
  width: 100px;
  margin-bottom: 15px;
}

.sidebar ul {
  list-style: none;
  padding: 0;
  flex: 0;
}

.sidebar li {
  margin: 15px 0;
}

.sidebar a {
  color: white;
  text-decoration: none;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
}

.sidebar a.router-link-exact-active {
  font-weight: bold;
  border-left: 4px solid #fff;
  padding-left: 8px;
}

.icon {
  width: 20px;
  height: 20px;
}

.logout-button {
  margin-top: 20px;
  align-self: center;
  background: #0c21db;
  border: none;
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  color: #fff;
  width: 100%;
}

.logout-button:hover {
  background: #5a67d8;
}

/* Main content */
.main-content {
  margin-left: 220px;
  padding: 80px 20px 20px 20px;
  transition: margin-left 0.3s ease;
}

/* Mobile Styles */
@media (max-width: 768px) {
  .menu-btn {
    display: block;
  }

  .sidebar {
    transform: translateX(-100%);
    top: 0;
  }

  .sidebar-mobile-open {
    transform: translateX(0);
  }

  .main-content {
    margin-left: 0;
    padding-top: 70px;
  }

  .mobile-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.4);
    z-index: 100;
  }
}
</style>
