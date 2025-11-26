<template>
  <div class="container mt-4">
       <!-- Header -->
        <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap">
          <button
            class="save-btn"
            data-bs-toggle="modal"
            data-bs-target="#addDriverModal"
          >
            <i class="bi bi-plus-lg"></i> Ajouter
          </button>
          <input
            v-model="searchTerm"
            type="text"
            class="form-control"
            placeholder="Rechercher un chauffeur..."
            style="width: 250px"
          />
        </div>
    <div class="card shadow-sm">
      <div class="card-body">
      

        <!-- Tableau -->
      <card class="table-responsive shadow-lg mb-3">

        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-primary" style="color: blue !important;">

              <tr>
                <th colspan="6" class="text-center">Liste des Chauffeurs</th>
              </tr>
              <tr>
                <th @click="sortBy('nom')" style="cursor:pointer">
                  Nom
                  <i v-if="sortKey === 'nom' && sortOrder === 'asc'" class="bi bi-caret-up-fill"></i>
                  <i v-if="sortKey === 'nom' && sortOrder === 'desc'" class="bi bi-caret-down-fill"></i>
                </th>
                <th @click="sortBy('prenom')" style="cursor:pointer">
                  Prénom
                  <i v-if="sortKey === 'prenom' && sortOrder === 'asc'" class="bi bi-caret-up-fill"></i>
                  <i v-if="sortKey === 'prenom' && sortOrder === 'desc'" class="bi bi-caret-down-fill"></i>
                </th>
                <th>Téléphone</th>
                <th>Permis</th>
                <th>Date d’ajout</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in paginatedDrivers" :key="d.id">
                <td>{{ d.nom }}</td>
                <td>{{ d.prenom }}</td>
                <td>{{ d.telephone }}</td>
                <td>{{ d.permis }}</td>
                <td>{{ formatDate(d.created_at) }}</td>
                <td class="text-center">

          <!-- Icône Modifier (bleu) -->
           <button class="btn btn-sm btn-primary me-2" @click="openEditModal(d)">
                    <i class="bi bi-pencil-square"></i>
                  </button>


          <!-- Icône Supprimer (rouge) -->
          <button class="btn btn-sm btn-danger" @click="deleteDriver(d.id)">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>

              </tr>
              <tr v-if="filteredDrivers.length === 0">
                <td colspan="6" class="text-center text-muted">
                  Aucun chauffeur trouvé
                </td>
              </tr>
            </tbody>
            <tfoot class="justify-content-center mt-3">
            <tr>
              <td colspan="5">

                <nav class="d-flex justify-content-center">
                  <ul class="pagination">

                    <li class="page-item" :class="{ disabled: currentPage === 1 }">
                      <button class="page-link" @click="currentPage--">Précédent</button>
                    </li>

                    <li
                      v-for="page in totalPages"
                      :key="page"
                      class="page-item"
                      :class="{ active: currentPage === page }"
                    >
                      <button class="page-link" @click="currentPage = page">
                        {{ page }}
                      </button>
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
       </card>
      </div>
    </div>

    <!-- Modal ajout/modification -->
    <div
      class="modal fade"
      id="addDriverModal"
      tabindex="-1"
      aria-labelledby="addDriverModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title" id="addDriverModalLabel">
              {{ editingDriver ? "Modifier le chauffeur" : "Ajouter un chauffeur" }}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>

          <form @submit.prevent="saveDriver">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Nom</label>
                <input v-model="driverForm.nom" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Prénom</label>
                <input v-model="driverForm.prenom" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Téléphone</label>
                <input v-model="driverForm.telephone" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Permis</label>
                <input v-model="driverForm.permis" class="form-control" required />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                Annuler
              </button>
              <button type="submit" class="btn btn-primary">
                {{ editingDriver ? "Enregistrer" : "Ajouter" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
  
  <button
  id="openModalBtn"
  data-bs-toggle="modal"
  data-bs-target="#addDriverModal"
  style="display: none;">
</button>

</template>


<script>
import api from "../api.js";
import 'bootstrap/dist/js/bootstrap.bundle.min.js';


export default {
 data() {
  return {
    drivers: [],
    driverForm: { nom: "", prenom: "", telephone: "", permis: "" },
    editingDriver: null,
    searchTerm: "",
    sortKey: "nom",
    sortOrder: "asc",
    currentPage: 1,      // page actuelle
    perPage: 5           // nombre d'éléments par page
  };
},

  async created() {
    this.fetchDrivers();
  },
 computed: {
  filteredDrivers() {
    let list = this.drivers.filter((d) =>
      (d.nom + " " + d.prenom + " " + d.telephone + " " + d.permis)
        .toLowerCase()
        .includes(this.searchTerm.toLowerCase())
    );
    list.sort((a, b) => {
      const modifier = this.sortOrder === "asc" ? 1 : -1;
      if (a[this.sortKey] < b[this.sortKey]) return -1 * modifier;
      if (a[this.sortKey] > b[this.sortKey]) return 1 * modifier;
      return 0;
    });
    return list;
  },

  paginatedDrivers() {
    const start = (this.currentPage - 1) * this.perPage;
    const end = start + this.perPage;
    return this.filteredDrivers.slice(start, end);
  },

  totalPages() {
    return Math.ceil(this.filteredDrivers.length / this.perPage) || 1;
  }
},

  methods: {
    async fetchDrivers() {
      const res = await api.get("/drivers");
      this.drivers = res.data;
    },
  openEditModal(driver) {
  console.log("Driver reçu :", driver);  // 👈 voir si les données arrivent
  this.editingDriver = driver;
  this.driverForm = { ...driver };
  document.getElementById("openModalBtn").click();
},

  async saveDriver() {
  if (this.editingDriver) {
    await api.put(`/drivers/${this.editingDriver.id}`, this.driverForm);
  } else {
    await api.post("/drivers", this.driverForm);
  }

  this.fetchDrivers();
  this.resetForm();

  // 🔥 Fermer le modal proprement
      const modal = bootstrap.Modal.getOrCreateInstance(
        document.getElementById("addDriverModal")
      );
      modal.hide();
},

    resetForm() {
      this.driverForm = { nom: "", prenom: "", telephone: "", permis: "" };
      this.editingDriver = null;
    },
    async deleteDriver(id) {
      if (confirm("Voulez-vous supprimer ce chauffeur ?")) {
        await api.delete(`/drivers/${id}`);
        this.fetchDrivers();
      }
    },
    sortBy(key) {
      if (this.sortKey === key) {
        this.sortOrder = this.sortOrder === "asc" ? "desc" : "asc";
      } else {
        this.sortKey = key;
        this.sortOrder = "asc";
      }
    },
    formatDate(date) {
      if (!date) return "";
      return new Date(date).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    },
  },
};
</script>

<style scoped>
.table th {
  user-select: none;
  vertical-align: middle;
}
.table td {
  vertical-align: middle;
}
.btn {
  border-radius: 8px;

}
.save-btn {
  background: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
}

</style>
