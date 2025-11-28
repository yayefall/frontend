<template>
  <div class="container mt-4">
    <div class="py-3 mb-4">
      <h3 class="text-center text-white m-0">HISTORIQUE DU TABLEAU DE BORD</h3>
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
          <h5 class="card-title">Statistiques par table</h5>
          <!-- 🟦 CARDS DES STATISTIQUES PAR TABLE -->
          <div class="row g-3">
            <div v-for="t in tableStats" :key="t.table" class="col-md-4">
              <div class="stat-card p-3 shadow rounded text-white" :class="t.color">
                <h4 class="fw-bold">{{ t.table.toUpperCase() }}</h4>
                <p class="m-0">Total : <strong>{{ t.total }}</strong></p>
                <p class="m-0">Create : <strong>{{ t.create }}</strong></p>
                <p class="m-0">Update : <strong>{{ t.update }}</strong></p>
                <p class="m-0">Delete : <strong>{{ t.delete }}</strong></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    <!-- GRAPHIQUE PAR TABLE -->
    <div class="mb-4">
      <div class="card mb-3 shadow">
        <div class="card-body">
          <h5 class="card-title">Actions par table</h5>
          <canvas id="tableChart"></canvas>
        </div>
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
      tableStats: [],
      allHistory: [],
      fullHistory: [],
      history: [],
      tables: [],
      filterTable: '',
      filterUser: '',
      filterStartDate: '',
      filterEndDate: '',
      currentPage: 1,
      itemsPerPage: 5,
      totalPages: 1,
      tableChart: null,
    };
  },

  async mounted() {
  await this.loadAllHistory();   // 🔥 Doit être fait avant les stats

  await this.fetchHistory();

  this.initTableChart();
  this.updateTableChart();
},

  watch: {
    filterTable() { this.applyFilters(); },
    filterUser() { this.applyFilters(); },
    filterStartDate() { this.applyFilters(); },
    filterEndDate() { this.applyFilters(); }
  },

  methods: {
 /*async loadAllHistory() {
  try {
    const token = localStorage.getItem("token");

    const res = await api.get("/history/exportAll", {
      headers: { Authorization: `Bearer ${token}` }
    });

    this.allHistory = res.data;

    this.updateTableStats();
    this.updateTableChart();

  } catch (error) {
    console.error("Erreur récupération all history :", error);
  }
},*/

async loadAllHistory() {
  try {
    const token = localStorage.getItem("token");

    const res = await api.get("/history/exportAll", {
      headers: { Authorization: `Bearer ${token}` }
    });

    this.allHistory = res.data;

    // 🔥 Récupère automatiquement toutes les tables existantes
    this.tables = [...new Set(this.allHistory.map(h => h.table_name))];

    this.updateTableStats();
  } catch (error) {
    console.error("Erreur récupération all history :", error);
  }
},


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

        // Mise à jour tableau + stats + graph
        this.updateTableStats();
        this.updateTableChart();


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

    updateTableStats() {
      if (!this.allHistory.length) return;

      const stats = [];

      this.tables.forEach(t => {
        const rows = this.allHistory.filter(h => h.table_name === t);

      stats.push({
      table: t,
      total: rows.length,
      create: rows.filter(r => r.action === "create").length,
      update: rows.filter(r => r.action === "update").length,
      delete: rows.filter(r => r.action === "delete").length,
      color: ['success','primary','danger','warning','info'][Math.random()*5|0]
    });
  });

  this.tableStats = stats;
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

.stat-card {
  background: linear-gradient(135deg, #0d6efd, #0744a6);
  border-left: 6px solid white;
  animation: fadeIn 0.4s ease-in-out;
}

.stat-card.success { background: linear-gradient(135deg, #198754, #0f5738); }
.stat-card.danger { background: linear-gradient(135deg, #dc3545, #8a1c26); }
.stat-card.warning { background: linear-gradient(135deg, #ffc107, #b38600); }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

</style>
