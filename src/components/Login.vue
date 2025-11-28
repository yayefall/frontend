<template>
  <div class="login-page">
    <div class="login-card">
      <div class="logo">
        <img src="/src/assets/chec2.png" alt="VehiculeApp Logo" />
      </div>
      <h2 class="title">Connexion</h2>

      <form @submit.prevent="login" class="login-form">
        <div class="input-group">
          <input v-model="form.username" type="text" placeholder="Nom d'utilisateur" required />
        </div>

        <div class="input-group">
          <input v-model="form.password" type="password" placeholder="Mot de passe" required />
        </div>

        <button type="submit" :disabled="loading">
          {{ loading ? "Connexion..." : "Se connecter" }}
        </button>
      </form>

      <p v-if="error" class="text-danger">{{ error }}</p>
      <p class="note">© 2025 CHEC AUTOMOBILE</p>
    </div>
  </div>
</template>

<script>
import api from "../api.js";

export default {
  name: "Login",
  data() {
    return {
      form: {
        username: "",
        password: "",
      },
      loading: false,
      error: null,
    };
  },

  methods: {
    async login() {
      this.error = null;
      this.loading = true;

      try {
        // 1️⃣ Obtenir le cookie CSRF
            // await api.get("/sanctum/csrf-cookie");
      const response = await api.post("/login", {
        username: this.form.username,
        password: this.form.password,
      });

      // Sauvegarder le bon token !
      localStorage.setItem("auth_token", response.data.access_token);


        // 4️⃣ Redirection
        this.$router.push("/header/vehicules");

      } catch (err) {
        console.error(err);
        this.error = "Identifiants incorrects ou problème serveur.";
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #1e1c9e, #1e1c9e);
  font-family: 'Poppins', sans-serif;
  box-sizing: border-box;
}

.login-card {
  background: #fff;
  padding: 30px 25px;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  width: 100%;
  max-width: 380px;
  text-align: center;
  box-sizing: border-box;
}

.logo img {
  width: 90px;
  margin-bottom: 15px;
}

.title {
  font-size: 26px;
  color: #333;
  margin-bottom: 25px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.input-group input {
  width: 100%;
  padding: 12px 15px;
  border-radius: 10px;
  border: 1px solid #ccc;
  font-size: 16px;
  box-sizing: border-box;
  transition: border-color 0.3s ease;
}

.input-group input:focus {
  border-color: #1e1c9e;
  outline: none;
}

button {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 10px;
  background: #1e1c9e;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
}

button:disabled {
  background: #a0a0a0;
  cursor: not-allowed;
}

button:hover:enabled {
  background: #5a67d8;
}

.note {
  margin-top: 20px;
  color: #888;
  font-size: 14px;
}

.text-danger {
  color: #e53e3e;
  font-size: 14px;
}

@media (max-width: 500px) {
  .login-card { padding: 20px 15px; }
  .title { font-size: 22px; }
  .input-group input { font-size: 14px; padding: 10px 12px; }
  button { font-size: 16px; padding: 10px; }
}
</style>
