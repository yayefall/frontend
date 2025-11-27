<template>
  <div class="container mt-4">
    <div class="py-3 mb-4">
      <h3 class="text-center text-white m-0">HISTORIQUE DU TABLEAU DE BOARD</h3>
    </div>

    <!-- FILTRES -->
    <div class="mb-3 d-flex flex-wrap gap-2 align-items-center">
      <select v-model="filterTable" class="form-select" style="width: 200px;">
        <option value="">Toutes les tables</option>
        <option v-for="t in tables" :key="t" :value="t">{{ t }}</option>
      </select>
      <input type="text" v-model="filterUser" class="form-control" placeholder="Filtrer par utilisateur" style="width: 200px;">
      <input type="date" v-model="filterStartDate" class="form-control" placeholder="Date début">
      <input type="date" v-model="filterEndDate" class="form-control" placeholder="Date fin">

      <!-- BOUTONS EXPORT -->
      <button class="btn btn-success" @click="exportCSV">Exporter CSV</button>
      <button class="btn btn-danger" @click="exportPDF">Exporter PDF</button>
    </div>

    <!-- TABLEAU HISTORIQUE -->
    <div class="table-responsive mb-4">
      <table class="table table-bordered table-hover" id="historyTable">
        <thead class="table-primary">
          <tr>
            <th>Date</th>
            <th>Table</th>
            <th>Action</th>
            <th>Numéro d'enregistrement</th>
            <th>Utilisateur</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="h in history" :key="h.id">
            <td>{{ formatDate(h.created_at) }}</td>
            <td>{{ h.table_name }}</td>
            <td>{{ h.action }}</td>
            <td>{{ h.record_id }}</td>
            <td>{{ h.username }}</td>
            <td>{{ h.description }}</td>
          </tr>
          <tr v-if="history.length === 0">
            <td colspan="6" class="text-center text-muted">Aucun mouvement trouvé</td>
          </tr>
        </tbody>

        <!-- PAGINATION -->
        <tfoot>
          <tr>
            <td colspan="6" class="pt-4">
              <nav v-if="totalPages > 1" aria-label="Pagination">
                <ul class="pagination justify-content-center flex-wrap">
                  <li class="page-item" :class="{ disabled: currentPage === 1 }">
                    <button class="page-link" @click="changePage(currentPage - 1)">Précédent</button>
                  </li>
                  <li class="page-item" v-for="page in totalPages" :key="page" :class="{ active: currentPage === page }">
                    <button class="page-link" @click="changePage(page)">{{ page }}</button>
                  </li>
                  <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                    <button class="page-link" @click="changePage(currentPage + 1)">Suivant</button>
                  </li>
                </ul>
              </nav>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- GRAPHIQUES -->
    <div class="mb-4">
      <div class="card mb-3">
        <div class="card-body">
          <h5 class="card-title">Actions par table</h5>
          <canvas id="tableChart"></canvas>
        </div>
      </div>
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">Actions par semaine</h5>
          <canvas id="weekChart"></canvas>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from "../api.js";
import Chart from "chart.js/auto";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default {
  data() {
    return {
      history: [],
      tables: ['lavages','drivers','entretiens','users','vehicules'],
      filterTable: '',
      filterUser: '',
      filterStartDate: '',
      filterEndDate: '',
      currentPage: 1,
      itemsPerPage: 5,
      totalPages: 1,
      tableChart: null,
      weekChart: null
    };
  },

  async mounted() {
    await this.fetchHistory();     // D'abord récupérer les données

    this.initTableChart();         // Ensuite créer les graphiques
    this.initWeekChart();

    this.updateTableChart();       // Puis mettre à jour
    this.updateWeekChart();
  },

  watch: {
    filterTable() { this.applyFilters(); },
    filterUser() { this.applyFilters(); },
    filterStartDate() { this.applyFilters(); },
    filterEndDate() { this.applyFilters(); }
  },

  methods: {
    applyFilters() {
      this.currentPage = 1;
      this.fetchHistory();
    },

    async fetchHistory(all=false) {
      try {
        const params = {
          table: this.filterTable,
          user: this.filterUser,
          startDate: this.filterStartDate,
          endDate: this.filterEndDate,
          page: all ? 1 : this.currentPage,
          perPage: all ? 1000 : this.itemsPerPage
        };

        const response = await api.get("/history", { params });

        if(all) return response.data.data;

        this.history = response.data.data;
        this.totalPages = response.data.totalPages;

        // Mise à jour graphique en temps réel
        this.updateTableChart();
        this.updateWeekChart();

      } catch (error) {
        console.error("Erreur récupération historique :", error);
      }
    },

    changePage(page) {
      if(page < 1 || page > this.totalPages) return;
      this.currentPage = page;
      this.fetchHistory();
    },

    formatDate(d) {
      return new Date(d).toLocaleString('fr-FR');
    },

    /* --------------------------
       GRAPHIQUE PAR TABLE
    -------------------------- */
    initTableChart() {
      const ctx = document.getElementById("tableChart").getContext("2d");
      this.tableChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: this.tables,
          datasets: [
            { label: 'Create', data: [], backgroundColor: '#198754' },
            { label: 'Update', data: [], backgroundColor: '#0d6efd' },
            { label: 'Delete', data: [], backgroundColor: '#dc3545' }
          ]
        }
      });
    },

    updateTableChart() {
      if (!this.tableChart) return;

      this.tableChart.data.datasets[0].data =
        this.tables.map(t => this.history.filter(h => h.table_name === t && h.action === 'create').length);

      this.tableChart.data.datasets[1].data =
        this.tables.map(t => this.history.filter(h => h.table_name === t && h.action === 'update').length);

      this.tableChart.data.datasets[2].data =
        this.tables.map(t => this.history.filter(h => h.table_name === t && h.action === 'delete').length);

      this.tableChart.update();
    },

    /* --------------------------
       GRAPHIQUE PAR SEMAINE
    -------------------------- */
    initWeekChart() {
      const ctx = document.getElementById("weekChart").getContext("2d");
      this.weekChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: [],
          datasets: [
            { label: 'Create', data: [], borderColor:'#198754', fill:false },
            { label: 'Update', data: [], borderColor:'#0d6efd', fill:false },
            { label: 'Delete', data: [], borderColor:'#dc3545', fill:false }
          ]
        }
      });
    },

   updateWeekChart() {
  if (!this.weekChart) return;

  const weekMap = {};

  this.history.forEach(h => {
    if(!h.created_at) return;

    const d = new Date(h.created_at + 'Z'); // UTC
    if (isNaN(d.getTime())) return;

    const year = d.getFullYear();
    const week = this.getWeekNumber(d);
    const key = `${year}-S${week.toString().padStart(2,'0')}`;

    if(!weekMap[key]) weekMap[key] = { create:0, update:0, delete:0 };

    const action = h.action.toLowerCase();
    if(['create','update','delete'].includes(action))
      weekMap[key][action]++;
  });

  const labels = Object.keys(weekMap).sort();
  this.weekChart.data.labels = labels;
  this.weekChart.data.datasets[0].data = labels.map(l => weekMap[l].create);
  this.weekChart.data.datasets[1].data = labels.map(l => weekMap[l].update);
  this.weekChart.data.datasets[2].data = labels.map(l => weekMap[l].delete);

  this.weekChart.update();
},

    getWeek(date) {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
      return `S${Math.ceil((((d - yearStart) / 86400000) + 1) / 7)}`;
    },

    /* --------------------------
       EXPORT PDF
    -------------------------- */
    async exportPDF() {
      const allData = await this.fetchHistory(true);

      const doc = new jsPDF("p", "pt", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      let topMargin = 40;

      let title = "Historique des mouvements";
      if (this.filterTable) title += ` - Table : ${this.filterTable}`;
      if (this.filterUser) title += ` - Utilisateur : ${this.filterUser}`;
      if (this.filterStartDate || this.filterEndDate) title += " - Période filtrée";

      doc.setFontSize(18);
      doc.setFont("Helvetica", "bold");
      doc.text(title, pageWidth/2, topMargin, { align: "center" });

      topMargin += 30;

      /* GRAPH 1 */
      const canvas1 = document.getElementById("tableChart");
      if (canvas1) {
        doc.addImage(canvas1.toDataURL("image/png"), "PNG", 40, topMargin, pageWidth-80, 200);
        topMargin += 220;
      }

      /* GRAPH 2 */
      const canvas2 = document.getElementById("weekChart");
      if (canvas2) {
        doc.addImage(canvas2.toDataURL("image/png"), "PNG", 40, topMargin, pageWidth-80, 200);
        topMargin += 220;
      }

      /* TABLEAU */
      autoTable(doc, {
        startY: topMargin,
        head: [["#", "Date", "Table", "Action", "Numéro", "Utilisateur", "Description"]],
        body: allData.map((h,i)=>[
          i+1,
          this.formatDate(h.created_at),
          h.table_name,
          h.action,
          h.record_id,
          h.username,
          h.description || ""
        ]),
        headStyles: { fillColor:[0,123,255], textColor:255 }
      });

      doc.save("historique_filtré.pdf");
    }
  }
};
</script>


<style scoped>
.pagination .page-link { padding: 8px 14px; border-radius:6px; font-weight:500; }
.pagination .page-item.active .page-link { background-color:#0d6efd; border-color:#0d6efd; color:white; }
.pagination .page-item.disabled .page-link { opacity:0.5; cursor:not-allowed; }
.table th, .table td { vertical-align: middle; }
</style>
