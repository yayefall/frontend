<template>
  <div class="container mt-4">
 <!-- HEADERS -->
      <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap">
          <button class="save-btn " data-bs-toggle="modal" data-bs-target="#addEntretienModal">
            <i class="bi bi-plus-lg"></i> Ajouter
          </button>
          <input
            v-model="searchTerm"
            type="text"
            class="form-control"
            placeholder="Rechercher un entretien..."
            style="width: 250px"
          />
        </div>
    <!-- TABLEAU -->
    <div class="card shadow-sm">
      <div class="card-body">
        <div class="table-responsive">
          
                <P colspan="5" class="text-center "> <strong>Liste des Entretiens</strong></P>
              
          <table class="table table-hover align-middle mb-0">
            
            <thead class="table-primary">
              
              <tr>
                <th>Date</th>
                <th>Véhicule</th>
                <th>Type</th>
                <th>Remarques</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="e in paginatedEntretiens" :key="e.id">
                <td>{{ formatDate(e.date_entretien) }}</td>
                <td>{{ e.vehicule?.immatriculation || 'Non assigné' }}</td>
                <td>{{ e.type }}</td>
                <td>{{ e.remarques }}</td>
                <td class="text-center">

                  <!-- Icône Modifier (bleu) -->
                   <button class="btn btn-sm btn-primary me-2" @click="openEditModal(l)">
                    <i class="bi bi-pencil-square"></i>
                  </button>


                  <!-- Icône Supprimer (rouge) -->
                  <button class="btn btn-sm btn-danger" @click="deleteEntretien(e.id)">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="filteredEntretiens.length === 0">
                <td colspan="5" class="text-center text-muted">Aucun entretien trouvé</td>
              </tr>
            </tbody>
                      <!-- PAGINATION -->
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
      </div>
    </div>

    <!-- Modal ajout/modification -->
    <div class="modal fade" id="addEntretienModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">{{ editingEntretien ? "Modifier l'entretien" : "Ajouter un entretien" }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>

          <form @submit.prevent="saveEntretien">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Véhicule</label>
                <select v-model="entretienForm.vehicule_id" class="form-control">
                  <option value="">Non assigné</option>
                  <option v-for="v in vehicules" :key="v.id" :value="v.id">{{ v.immatriculation }}</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Date</label>
                <input type="date" v-model="entretienForm.date_entretien" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Type</label>
                <input v-model="entretienForm.type" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Remarques</label>
                <textarea v-model="entretienForm.remarques" class="form-control"></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
              <button type="submit" class="btn btn-primary">{{ editingEntretien ? "Enregistrer" : "Ajouter" }}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>

  <button
  id="openModalBtn"
  data-bs-toggle="modal"
  data-bs-target="#addEntretienModal"
  style="display: none;">
  </button>
</template>

<script>
import api from "../api.js";
import 'bootstrap/dist/js/bootstrap.bundle.min.js';


export default {
 data() {
  return {
    entretiens: [],
    vehicules: [],
    entretienForm: { vehicule_id: "", date_entretien: "", type: "", remarques: "" },
    editingEntretien: null,
    searchTerm: "",
    currentPage: 1,       // page actuelle
    perPage: 5            // nombre d'éléments par page
  };
},

  async created() {
    await this.fetchVehicules();
    this.fetchEntretiens();
  },
 computed: {
  filteredEntretiens() {
    return this.entretiens.filter(e =>
      (e.vehicule?.immatriculation + " " + e.type + " " + e.remarques)
        .toLowerCase()
        .includes(this.searchTerm.toLowerCase())
    );
  },
  paginatedEntretiens() {
    const start = (this.currentPage - 1) * this.perPage;
    const end = start + this.perPage;
    return this.filteredEntretiens.slice(start, end);
  },
  totalPages() {
    return Math.ceil(this.filteredEntretiens.length / this.perPage);
  }
},

  methods: {
    async fetchVehicules() { 
      this.vehicules = (await api.get("/vehicules")).data; },

    async fetchEntretiens() { 
      this.entretiens = (await api.get("/entretiens")).data; },

    openEditModal(e) {
       this.editingEntretien = e; 
       this.entretienForm = { ...e }; 
       document.getElementById("openModalBtn").click();
    },
    
    async saveEntretien() {
      if(this.editingEntretien) await api.put(`/entretiens/${this.editingEntretien.id}`, this.entretienForm);
      else await api.post("/entretiens", this.entretienForm);
      this.fetchEntretiens();
      this.resetForm();
      bootstrap.Modal.getInstance(
       document.getElementById("addEntretienModal")).hide();
    },
    resetForm()
     { 
      this.entretienForm = { vehicule_id: "", date_entretien: "", type: "", remarques: "" }; 
      this.editingEntretien = null; },

    async deleteEntretien(id)  { 
      if(confirm("Voulez-vous supprimer cet entretien ?")) 
    { await api.delete(`/entretiens/${id}`); 
      this.fetchEntretiens(); 
    } 
  },
    formatDate(date) { if(!date) return ""; return new Date(date).toLocaleDateString("fr-FR"); }
  }
}
</script>

<style scoped>
.save-btn {
  background: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
}
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

</style>
