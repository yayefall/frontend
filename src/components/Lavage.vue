<template>
  <div class="container mt-4">
    <div v-if="successMessage" class="alert alert-success text-center">
    {{ successMessage }}
    </div>
    <!-- Header -->
   <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3">
  <!-- Left side: Add and export buttons -->
  <div class="d-flex flex-wrap mb-2 mb-md-0 gap-2">
    <button class="save-btn" @click="openAddModal">
      <i class="bi bi-plus-lg"></i> Ajouter
    </button>
    <button class="btn btn-danger" @click="exportPDFAll">
      <i class="bi bi-file-earmark-pdf"></i> PDF
    </button>
    <button class="btn btn-success" @click="exportExcel">
      <i class="bi bi-file-earmark-excel"></i> Excel
    </button>
  </div>

  <!-- Middle: Period and vehicle filters -->
  <div class="d-flex flex-wrap gap-2 mb-2 mb-md-0">
    <select v-model="period" class="form-select" style="min-width: 140px;" @change="onPeriodChange">
      <option value="all">Tous</option>
      <option value="today">Aujourd'hui</option>
      <option value="this_week">Cette semaine</option>
      <option value="this_month">Ce mois</option>
      <option value="this_year">Cette année</option>
      <option value="custom">Période personnalisée</option>
    </select>

    <input v-if="period==='custom'" type="date" v-model="customStart" class="form-control" style="min-width: 120px;" />
    <input v-if="period==='custom'" type="date" v-model="customEnd" class="form-control" style="min-width: 120px;" />

    <select v-model="selectedVehicule" class="form-select" style="min-width: 150px;" @change="currentPage=1">
      <option value="">Tous les véhicules</option>
      <option v-for="v in vehicules" :key="v.id" :value="v.id">{{ v.immatriculation }}</option>
    </select>
  </div>

  <!-- Right: Search box -->
  <div class="mt-2 mt-md-0" style="min-width: 200px;">
    <input
      v-model="searchTerm"
      @input="currentPage = 1"
      type="text"
      class="form-control"
      placeholder="Rechercher un lavage..."
    />
  </div>
</div>


    <!-- Card / Table -->
    <div class="card shadow-sm">
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-primary">
              <tr>
                <th colspan="6" class="text-center">Liste des Lavages</th>
              </tr>
              <tr>
                <th>Date</th>
                <th>Véhicule</th>
                <th>Type</th>
                <th>Effectué par</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="l in paginatedLavages" :key="l.id">
                <td>{{ formatDate(l.date_lavage) }}</td>
                <td>{{ l.vehicule?.immatriculation || 'Non assigné' }}</td>
                <td>{{ l.type }}</td>
                <td>{{ l.effectué_par }}</td>
                <td class="text-center">
                  <button class="btn btn-sm btn-primary me-2" @click="openEditModal(l)">
                    <i class="bi bi-pencil-square"></i>
                  </button>

                  <button class="btn btn-sm btn-outline-secondary me-2" @click="exportPDFReceipt(l)">
                    <i class="bi bi-receipt"></i> Reçu
                  </button>

                  <button class="btn btn-sm btn-danger" @click="deleteLavage(l.id)">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="filteredLavages.length === 0">
                <td colspan="6" class="text-center text-muted">Aucun lavage trouvé</td>
              </tr>
            </tbody>

            <!-- Pagination footer -->
            <tfoot>
              <tr>
                <td colspan="6">
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
    <div class="modal fade" id="addLavageModal" tabindex="-1" aria-labelledby="addLavageModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">
              {{ editingLavage ? "Modifier le lavage" : "Ajouter un lavage" }}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>

          <form @submit.prevent="saveLavage">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Véhicule</label>
                <select v-model="lavageForm.vehicule_id" class="form-control">
                  <option value="">Non assigné</option>
                  <option v-for="v in vehicules" :key="v.id" :value="v.id">{{ v.immatriculation }}</option>
                </select>
                <div v-if="warningMessage" class="alert alert-warning mt-2">
                  {{ warningMessage }}
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Date</label>
                <input type="date" v-model="lavageForm.date_lavage" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Type</label>
                <input v-model="lavageForm.type" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Effectué par</label>
                <input v-model="lavageForm.effectué_par" class="form-control" required />
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
              <button type="submit" class="btn btn-primary"
                :disabled="lavageForm.vehicule_id && getLavagesThisWeek(lavageForm.vehicule_id) >= 2">
                {{ editingLavage ? "Enregistrer" : "Ajouter" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

  </div>
</template>
<script>
import api from "../api.js";
import { Modal } from "bootstrap";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export default {
  data() {
    return {
      successMessage: "",
      currentPage: 1,
      itemsPerPage: 5,
      warningMessage: "",
      lavages: [],
      vehicules: [],
      lavageForm: { vehicule_id: "", date_lavage: "", type: "", effectué_par: "" },
      editingLavage: null,
      searchTerm: "",
      period: "all",
      customStart: "",
      customEnd: "",
      selectedVehicule: ""
    };
  },

  async created() {
    await this.fetchVehicules();
    await this.fetchLavages();
  },

  computed: {
    filteredLavages() {
      const searchFiltered = this.lavages.filter(l =>
        ((l.vehicule?.immatriculation || "") + " " + l.type + " " + l.effectué_par)
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase())
      );

      const periodFiltered = searchFiltered.filter(l => this.matchesPeriod(l));

      if (this.selectedVehicule) {
        return periodFiltered.filter(l => l.vehicule_id == this.selectedVehicule);
      }

      return periodFiltered;
    },

    paginatedLavages() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.filteredLavages.slice(start, start + this.itemsPerPage);
    },

    totalPages() {
      return Math.max(1, Math.ceil(this.filteredLavages.length / this.itemsPerPage));
    }
  },

  watch: {
    "lavageForm.vehicule_id"(newVal) {
      if (!newVal) {
        this.warningMessage = "";
        return;
      }
      const count = this.getLavagesThisWeek(newVal);
      if (count === 0) this.warningMessage = "Aucun lavage effectué cette semaine pour ce véhicule.";
      else if (count === 1) this.warningMessage = "⚠️ Ce véhicule a déjà été lavé 1 fois cette semaine.";
      else if (count >= 2) this.warningMessage = "⚠️ Limite atteinte : ce véhicule a déjà été lavé 2 fois cette semaine.";
    }
  },

  methods: {
    async fetchVehicules() {
      this.vehicules = (await api.get("/vehicules")).data;
    },

    async fetchLavages() {
      this.lavages = (await api.get("/lavages")).data;
    },

    onPeriodChange() {
      if (this.period !== "custom") {
        this.customStart = "";
        this.customEnd = "";
      }
      this.currentPage = 1;
    },

    matchesPeriod(lavage) {
      if (!lavage.date_lavage) return false;
      const d = new Date(lavage.date_lavage);
      const now = new Date();

      if (this.period === "all") return true;
      if (this.period === "today") return d.toDateString() === now.toDateString();

      if (this.period === "this_week") {
        const start = new Date(now);
        start.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return d >= start && d <= end;
      }

      if (this.period === "this_month")
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();

      if (this.period === "this_year") return d.getFullYear() === now.getFullYear();

      if (this.period === "custom") {
        if (!this.customStart || !this.customEnd) return true;
        const start = new Date(this.customStart);
        const end = new Date(this.customEnd);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return d >= start && d <= end;
      }

      return true;
    },

    getLavagesThisWeek(vehicule_id) {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      return this.lavages.filter(
        l =>
          l.vehicule_id === vehicule_id &&
          new Date(l.date_lavage) >= startOfWeek &&
          new Date(l.date_lavage) <= endOfWeek
      ).length;
    },

    openAddModal() {
      this.resetForm();
      const modal = Modal.getOrCreateInstance(document.getElementById("addLavageModal"));
      modal.show();
    },

    openEditModal(l) {
      this.editingLavage = l;
      this.lavageForm = {
        vehicule_id: l.vehicule_id,
        date_lavage: l.date_lavage,
        type: l.type,
        effectué_par: l.effectué_par
      };
      const modal = Modal.getOrCreateInstance(document.getElementById("addLavageModal"));
      modal.show();
    },

    // 🟦 SAUVEGARDE + FERMETURE MODAL CORRIGÉE
    async saveLavage() {
      try {
        if (!this.lavageForm.type || !this.lavageForm.effectué_par || !this.lavageForm.date_lavage) {
          alert("Veuillez remplir tous les champs obligatoires !");
          return;
        }

        if (this.editingLavage) {
          await api.put(`/lavages/${this.editingLavage.id}`, this.lavageForm);
        } else {
          await api.post("/lavages", this.lavageForm);
        }

        await this.fetchLavages();
        this.resetForm();

        // ✔️ FERMETURE MODAL
        const modal = Modal.getInstance(document.getElementById("addLavageModal"));
        modal.hide();

        // ✔️ Messages corrigés
        this.successMessage = this.editingLavage
          ? "Lavage modifié avec succès !"
          : "Lavage ajouté avec succès !";

        setTimeout(() => (this.successMessage = ""), 3000);

        this.editingLavage = null;
        window.scrollTo({ top: 0, behavior: "smooth" });

      } catch (err) {
        console.error("Erreur :", err);
        this.successMessage = "Erreur lors de l'enregistrement. Réessaye.";
        setTimeout(() => (this.successMessage = ""), 3500);
      }
    },

    resetForm() {
      this.lavageForm = { vehicule_id: "", date_lavage: "", type: "", effectué_par: "" };
      this.editingLavage = null;
      this.warningMessage = "";
    },

    async deleteLavage(id) {
      if (confirm("Voulez-vous supprimer ce lavage ?")) {
        await api.delete(`/lavages/${id}`);
        await this.fetchLavages();
        this.showToast("Lavage supprimé !");
      }
    },

    formatDate(date) {
      if (!date) return "";
      return new Date(date).toLocaleDateString("fr-FR");
    },

    showToast(message) {
      const toastEl = document.createElement("div");
      toastEl.className =
        "toast align-items-center text-bg-success border-0 position-fixed top-0 end-0 m-3";
      toastEl.role = "alert";
      toastEl.innerHTML = `<div class="d-flex"><div class="toast-body">${message}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
      document.body.appendChild(toastEl);
      const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
      toast.show();
      toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
    },

    exportExcel() {
      const data = this.filteredLavages.map(l => ({
        Date: this.formatDate(l.date_lavage),
        Vehicule: l.vehicule?.immatriculation || "Non assigné",
        Type: l.type,
        "Effectué par": l.effectué_par
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Lavages");
      XLSX.writeFile(wb, "lavages.xlsx");
    },

    // 🟦 PDF COMPLET + TITRE CENTRÉ + FOOTER
    async exportPDFAll() {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const leftMargin = 40;
      let y = 40;

      try {
        const imgData = await this.getImageDataUrl("/chec2.png");
        doc.addImage(imgData, "PNG", leftMargin, y, 60, 60);
      } catch (e) {
        console.warn("Logo non chargé :", e);
      }

      doc.setFontSize(18);

      // ▶ CENTRAGE DU TITRE
      const pageWidth = doc.internal.pageSize.getWidth();
      const title = "Liste des lavages";
      const textWidth = doc.getTextWidth(title);
      const xCenter = (pageWidth - textWidth) / 2;

      doc.text(title, xCenter, y + 20);

      const rows = this.filteredLavages.map((l, index) => [
        index + 1,
        this.formatDate(l.date_lavage),
        l.vehicule?.immatriculation || "Non assigné",
        l.type,
        l.effectué_par
      ]);

      autoTable(doc, {
        startY: y + 80,
        head: [["#", "Date", "Véhicule", "Type", "Effectué par"]],
        body: rows,

        theme: "grid",
        styles: { fontSize: 10, cellPadding: 6 },
        headStyles: { fillColor: [13, 110, 253], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },

        margin: { left: leftMargin, right: leftMargin },

        didDrawPage: data => {
          const pageWidth = doc.internal.pageSize.width;
          const pageHeight = doc.internal.pageSize.height;
          const pageCount = doc.internal.getNumberOfPages();
          const page = doc.internal.getCurrentPageInfo().pageNumber;

          const footerY = pageHeight - 20;

          doc.setFontSize(10);
          doc.setTextColor(100);

          doc.setDrawColor(180);
          doc.line(leftMargin, footerY - 12, pageWidth - leftMargin, footerY - 12);

          doc.text("CarYayeFall Pro — YayeFallDev Lavage", leftMargin, footerY);
          doc.text(
            "Tel: +221 77 000 00 00 | Email: contact@caryayefall.com",
            leftMargin,
            footerY + 12
          );

          doc.text(`Page ${page} / ${pageCount}`, pageWidth - leftMargin - 60, footerY);
          doc.text(
            `Exporté le : ${new Date().toLocaleDateString()}`,
            pageWidth - leftMargin - 120,
            footerY + 12
          );
        }
      });

      const today = new Date().toISOString().slice(0, 10);
      doc.save(`lavages_${today}.pdf`);
    },

    async getImageDataUrl(url) {
      const res = await fetch(url);
      if (!res.ok) throw new Error("logo not found");
      const blob = await res.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  }
};
</script>

<style scoped>
.save-btn {
  background: white;
  border: none;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
}

@media (max-width: 767px) {
  .form-select, .form-control {
    width: 100% !important;
  }
}

.table th { user-select: none; vertical-align: middle; }
.table td { vertical-align: middle; }
.btn { border-radius: 8px; }
.save-btn { background: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; }
</style>
