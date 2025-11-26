<template>
  <div class="container mt-4">
    <div v-if="successMessage" class="alert alert-success text-center">
      {{ successMessage }}
    </div>

    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap">
      <button class="save-btn" @click="openAddModal">
        <i class="bi bi-plus-lg"></i> Ajouter
      </button>

      <input
        v-model="search"
        type="text"
        class="form-control"
        placeholder="Rechercher un utilisateur..."
        style="width: 250px"
      />
    </div>

    <!-- Tableau -->
    <div class="card shadow-sm">
      <div class="card-body table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-primary">
            <tr>
              <th>Avatar</th>
              <th>Nom</th>
              <th>Utilisateur</th>
              <th>Rôle</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in paginatedUsers" :key="u.id">
              <td>
                <img :src="u.avatar || defaultAvatar" width="40" height="40" class="rounded-circle border" />
              </td>
              <td>{{ u.name }}</td>
              <td>{{ u.username }}</td>
              <td>{{ u.role }}</td>
              <td class="text-center">
                <button class="btn btn-sm btn-primary me-2" @click="openEditModal(u)">
                  <i class="bi bi-pencil-square"></i>
                </button>

                <button class="btn btn-sm btn-danger" @click="deleteUser(u.id)">
                  <i class="bi bi-trash"></i>
                </button>
              </td>
            </tr>

            <tr v-if="filteredUsers.length === 0">
              <td colspan="5" class="text-center text-muted">Aucun utilisateur trouvé</td>
            </tr>
          </tbody>

          <!-- Pagination -->
          <tfoot class="justify-content-center mt-3">
            <tr>
              <td colspan="5">
                <nav class="d-flex justify-content-center">
                  <ul class="pagination">
                    <li class="page-item" :class="{ disabled: currentPage === 1 }">
                      <button class="page-link" @click="currentPage--">Précédent</button>
                    </li>

                    <li v-for="page in totalPages" :key="page"
                        class="page-item" :class="{ active: currentPage === page }">
                      <button class="page-link" @click="currentPage = page">{{ page }}</button>
                    </li>

                    <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                      <button class="page-link" @click="currentPage++">Suivant</button>
                    </li>
                  </ul>
                </nav>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <div class="modal fade" id="userModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">{{ editingUser ? "Modifier l'utilisateur" : "Ajouter un utilisateur" }}</h5>
            <button class="btn-close" data-bs-dismiss="modal"></button>
          </div>

          <form @submit.prevent="saveUser">
            <div class="modal-body">
              <!-- Avatar -->
              <div class="mb-3 text-center">
                <img :src="form.avatar || defaultAvatar" width="80" height="80" class="rounded-circle border"/>
              </div>

              <!-- Nom -->
              <div class="mb-3">
                <label>Nom</label>
                <input v-model="form.name" required class="form-control" />
              </div>

              <!-- Username -->
              <div class="mb-3">
                <label>Nom d'utilisateur</label>
                <input v-model="form.username" required class="form-control" />
              </div>

              <!-- Mot de passe -->
              <div class="mb-3">
                <label>Mot de passe</label>
                <input v-model="form.password" type="password" class="form-control" :required="!editingUser" />
              </div>

              <!-- Rôle -->
              <div class="mb-3">
                <label>Rôle</label>
                <select v-model="form.role" class="form-control">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
              <button class="btn btn-success" type="submit">{{ editingUser ? "Enregistrer" : "Ajouter" }}</button>
            </div>
          </form>

        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from "../api.js";
import { Modal, Toast } from "bootstrap"; // ✅ Correct import
import "bootstrap/dist/css/bootstrap.min.css";

export default {
  data() {
    return {
      successMessage: "",
      users: [],
      search: "",
      currentPage: 1,
      perPage: 5,
      editingUser: null,
      form: { name: "", username: "", password: "", role: "user", avatar: "" },
      defaultAvatar: "https://cdn-icons-png.flaticon.com/512/149/149071.png"
    };
  },

  async created() {
    await this.fetchUsers();
  },

  computed: {
    filteredUsers() {
      return this.users.filter(u =>
        (u.name + u.username + u.role).toLowerCase().includes(this.search.toLowerCase())
      );
    },
    totalPages() {
      return Math.ceil(this.filteredUsers.length / this.perPage);
    },
    paginatedUsers() {
      const start = (this.currentPage - 1) * this.perPage;
      return this.filteredUsers.slice(start, start + this.perPage);
    }
  },

  methods: {
    async fetchUsers() {
      const res = await api.get("/register");
      this.users = res.data.data ?? [];
    },

    openAddModal() {
      this.editingUser = null;
      this.resetForm();
      Modal.getOrCreateInstance(document.getElementById("userModal")).show();
    },

    openEditModal(u) {
      this.editingUser = u;
      this.form = { ...u, password: "" };
      Modal.getOrCreateInstance(document.getElementById("userModal")).show();
    },

   async saveUser() {
  try {
    if (!this.editingUser && !this.form.password) {
      alert("Veuillez saisir un mot de passe pour l'ajout !");
      return;
    }

    if (this.editingUser) {
      await api.put(`/register/${this.editingUser.id}`, this.form);
      this.showToast("Utilisateur modifié !");
    } else {
      console.log("Ajout user :", this.form); // debug
      await api.post("/register", this.form);
      this.showToast("Utilisateur ajouté !");
    }

    await this.fetchUsers();
    this.resetForm();

    // Fermeture du modal
    const modalEl = document.getElementById("userModal");
    Modal.getOrCreateInstance(modalEl).hide();

    this.successMessage = this.editingUser
      ? "Utilisateur modifié avec succès !"
      : "Utilisateur ajouté avec succès !";

    setTimeout(() => (this.successMessage = ""), 3000);
    this.editingUser = null;

  } catch (err) {
    console.error("Erreur :", err.response || err);
    this.successMessage = "Erreur lors de l'enregistrement. Réessaye.";
    setTimeout(() => (this.successMessage = ""), 3500);
  }
},


    resetForm() {
      this.form = { name: "", username: "", password: "", role: "user", avatar: "" };
    },

    async deleteUser(id) {
      if (confirm("Supprimer cet utilisateur ?")) {
        await api.delete(`/register/${id}`);
        await this.fetchUsers();
        this.showToast("Utilisateur supprimé !");
      }
    },

    showToast(message) {
      const el = document.createElement("div");
      el.className =
        "toast align-items-center text-bg-success border-0 position-fixed top-0 end-0 m-3";
      el.innerHTML = `
        <div class="d-flex">
          <div class="toast-body">${message}</div>
          <button class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      `;
      document.body.appendChild(el);
      const toast = new Toast(el, { delay: 3000 });
      toast.show();
      el.addEventListener("hidden.bs.toast", () => el.remove());
    }
  }
};
</script>

<style scoped>
.save-btn {
  background: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
}
.table td,
.table th {
  vertical-align: middle;
}
.btn {
  border-radius: 8px;
}
.pagination .active .page-link {
  background-color: #0d6efd;
  border-color: #0d6efd;
}
</style>
