<template>
  <div>
    <!-- Message de succès -->
    <div v-if="successMessage" class="alert alert-success text-center fade show" role="alert">
      {{ successMessage }}
    </div>

    <div class="container mt-4">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap">
        <button class="save-btn" @click="openAddModal">
          <i class="bi bi-plus-lg"></i> Ajouter
        </button>
        <input
          v-model="searchTerm"
          type="text"
          class="form-control"
          placeholder="Rechercher un véhicule..."
          style="width: 250px"
        />
      </div>

      <!-- Tableau -->
      <div class="card shadow-sm">
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-primary">
                <tr>
                  <th colspan="5" class="text-center">Liste des Véhicules</th>
                </tr>
                <tr>
                  <th @click="sortBy('immatriculation')" style="cursor:pointer">
                    Immatriculation
                    <i v-if="sortKey === 'immatriculation' && sortOrder === 'asc'" class="bi bi-caret-up-fill"></i>
                    <i v-if="sortKey === 'immatriculation' && sortOrder === 'desc'" class="bi bi-caret-down-fill"></i>
                  </th>
                  <th @click="sortBy('marque')" style="cursor:pointer">
                    Marque
                    <i v-if="sortKey === 'marque' && sortOrder === 'asc'" class="bi bi-caret-up-fill"></i>
                    <i v-if="sortKey === 'marque' && sortOrder === 'desc'" class="bi bi-caret-down-fill"></i>
                  </th>
                  <th @click="sortBy('modele')" style="cursor:pointer">
                    Modèle
                    <i v-if="sortKey === 'modele' && sortOrder === 'asc'" class="bi bi-caret-up-fill"></i>
                    <i v-if="sortKey === 'modele' && sortOrder === 'desc'" class="bi bi-caret-down-fill"></i>
                  </th>
                  <th>Chauffeur</th>
                  <th class="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="v in paginatedVehicules" :key="v.id">
                  <td>{{ v.immatriculation }}</td>
                  <td>{{ v.marque }}</td>
                  <td>{{ v.modele }}</td>
                  <td>{{ v.driver ? v.driver.nom + ' ' + v.driver.prenom : 'Non assigné' }}</td>
                  <td class="text-center">
                    <button class="btn btn-sm btn-primary me-2" @click="openEditModal(v)">
                      <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" @click="deleteVehicule(v.id)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
                <tr v-if="paginatedVehicules.length === 0">
                  <td colspan="5" class="text-center text-muted">Aucun véhicule trouvé</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="5">
                    <nav class="d-flex justify-content-center mt-3">
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
      </div>

      <!-- Modal ajout/modification -->
      <div class="modal fade" id="addVehiculeModal" tabindex="-1" aria-labelledby="addVehiculeModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title" id="addVehiculeModalLabel">
                {{ editingVehicule ? "Modifier le véhicule" : "Ajouter un véhicule" }}
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form @submit.prevent="saveVehicule">
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label">Immatriculation</label>
                  <input v-model="vehiculeForm.immatriculation" class="form-control" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Marque</label>
                  <input v-model="vehiculeForm.marque" class="form-control" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Modèle</label>
                  <input v-model="vehiculeForm.modele" class="form-control" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Chauffeur</label>
                  <select v-model="vehiculeForm.driver_id" class="form-control">
                    <option value="">Non assigné</option>
                    <option v-for="d in drivers" :key="d.id" :value="d.id">{{ d.nom }} {{ d.prenom }}</option>
                  </select>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                <button type="submit" class="btn btn-primary">
                  {{ editingVehicule ? "Enregistrer" : "Ajouter" }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import api from "../api.js";
import Modal from "bootstrap/js/dist/modal";

export default {
  data() {
    return {
      successMessage: "",
      vehicules: [],
      drivers: [],
      vehiculeForm: { immatriculation: "", marque: "", modele: "", driver_id: "" },
      editingVehicule: null,
      searchTerm: "",
      sortKey: "immatriculation",
      sortOrder: "asc",
      currentPage: 1,
      perPage: 5
    };
  },
  async created() {
    await this.fetchDrivers();
    this.fetchVehicules();
  },
  computed: {
    filteredVehicules() {
      let list = this.vehicules.filter(v =>
        (v.immatriculation + " " + v.marque + " " + v.modele + " " + (v.driver?.nom || "")).toLowerCase().includes(this.searchTerm.toLowerCase())
      );
      list.sort((a, b) => {
        const modifier = this.sortOrder === "asc" ? 1 : -1;
        if (a[this.sortKey] < b[this.sortKey]) return -1 * modifier;
        if (a[this.sortKey] > b[this.sortKey]) return 1 * modifier;
        return 0;
      });
      return list;
    },
    paginatedVehicules() {
      const start = (this.currentPage - 1) * this.perPage;
      return this.filteredVehicules.slice(start, start + this.perPage);
    },
    totalPages() {
      return Math.ceil(this.filteredVehicules.length / this.perPage) || 1;
    }
  },
  methods: {
    async fetchVehicules() { this.vehicules = (await api.get("/vehicules")).data; },
    async fetchDrivers() { this.drivers = (await api.get("/drivers")).data; },

    openAddModal() {
      this.resetForm();
      const modalEl = document.getElementById("addVehiculeModal");
      const modalInstance = Modal.getOrCreateInstance(modalEl);
      modalInstance.show();
    },

    openEditModal(v) {
      this.editingVehicule = v;
      this.vehiculeForm = { ...v };
      const modalEl = document.getElementById("addVehiculeModal");
      const modalInstance = Modal.getOrCreateInstance(modalEl);
      modalInstance.show();
    },

    async saveVehicule() {
      try {
        if (this.editingVehicule) {
          await api.put(`/vehicules/${this.editingVehicule.id}`, this.vehiculeForm);
        } else {
          await api.post("/vehicules", this.vehiculeForm);
        }
        await this.fetchVehicules();
        this.resetForm();

        // Fermer le modal
        const modalEl = document.getElementById("addVehiculeModal");
        const modalInstance = Modal.getOrCreateInstance(modalEl);
        modalInstance.hide();

        // Afficher message succès
        this.successMessage = this.editingVehicule
          ? "Véhicule modifié avec succès !"
          : "Véhicule ajouté avec succès !";

        setTimeout(() => this.successMessage = "", 3000);
        window.scrollTo({ top: 0, behavior: "smooth" });
        this.editingVehicule = null;

      } catch (err) {
        console.error("Erreur :", err);
        this.successMessage = "Erreur lors de l'enregistrement. Réessaye.";
        setTimeout(() => this.successMessage = "", 3500);
      }
    },

    resetForm() {
      this.vehiculeForm = { immatriculation: "", marque: "", modele: "", driver_id: "" };
      this.editingVehicule = null;
    },

    async deleteVehicule(id) {
      if (confirm("Voulez-vous supprimer ce véhicule ?")) {
        await api.delete(`/vehicules/${id}`);
        this.fetchVehicules();
      }
    },

    sortBy(key) {
      this.sortOrder = this.sortKey === key ? (this.sortOrder === "asc" ? "desc" : "asc") : "asc";
      this.sortKey = key;
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
.table th { user-select: none; vertical-align: middle; }
.table td { vertical-align: middle; }
.btn { border-radius: 8px; }
</style>
