<template>
  <div class="container mt-4">
<div class="bg-dark py-3 mb-4">
  <h3 class="text-center text-white m-0">Historique  Du Tableau de Bord </h3>
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

                  <!-- Précédent -->
                  <li class="page-item" :class="{ disabled: currentPage === 1 }">
                    <button class="page-link" @click="changePage(currentPage - 1)">
                      Précédent
                    </button>
                  </li>

                  <!-- Les pages -->
                  <li
                    class="page-item"
                    v-for="page in totalPages"
                    :key="page"
                    :class="{ active: currentPage === page }"
                  >
                    <button class="page-link" @click="changePage(page)">
                      {{ page }}
                    </button>
                  </li>

                  <!-- Suivant -->
                  <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                    <button class="page-link" @click="changePage(currentPage + 1)">
                      Suivant
                    </button>
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
  async created() {
    await this.fetchHistory();
  },
  watch: {
    filterTable() { this.currentPage = 1; this.fetchHistory(); },
    filterUser() { this.currentPage = 1; this.fetchHistory(); },
    filterStartDate() { this.currentPage = 1; this.fetchHistory(); },
    filterEndDate() { this.currentPage = 1; this.fetchHistory(); }
  },
  methods: {
    async fetchHistory() {
      try {
        const params = {
          table: this.filterTable,
          user: this.filterUser,
          startDate: this.filterStartDate,
          endDate: this.filterEndDate,
          page: this.currentPage,
          perPage: this.itemsPerPage
        };

        const response = await api.get("/history", { params });
        this.history = response.data.data;
        this.totalPages = response.data.totalPages;

        this.updateTableChart();
        this.updateWeekChart();
      } catch (error) {
        console.error("Erreur lors de la récupération de l'historique :", error);
      }
    },

    changePage(page) {
      if (page < 1 || page > this.totalPages) return;
      this.currentPage = page;
      this.fetchHistory();
    },

    formatDate(date) {
      return new Date(date).toLocaleString('fr-FR');
    },

    // ===== CHARTS =====
    initTableChart() {
      const ctx = document.getElementById("tableChart").getContext("2d");
      this.tableChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: this.tables, datasets: [
          { label: 'Create', data: [], backgroundColor: '#198754' },
          { label: 'Update', data: [], backgroundColor: '#0d6efd' },
          { label: 'Delete', data: [], backgroundColor: '#dc3545' }
        ]},
        options: { responsive: true, plugins: { title: { display: true, text: 'Actions par table' } } }
      });
    },
    updateTableChart() {
      if (!this.tableChart) return;
      const createData = this.tables.map(t => this.history.filter(h => h.table_name === t && h.action==='create').length);
      const updateData = this.tables.map(t => this.history.filter(h => h.table_name === t && h.action==='update').length);
      const deleteData = this.tables.map(t => this.history.filter(h => h.table_name === t && h.action==='delete').length);

      this.tableChart.data.datasets[0].data = createData;
      this.tableChart.data.datasets[1].data = updateData;
      this.tableChart.data.datasets[2].data = deleteData;
      this.tableChart.update();
    },

    initWeekChart() {
      const ctx = document.getElementById("weekChart").getContext("2d");
      this.weekChart = new Chart(ctx, {
        type: 'line',
        data: { labels: [], datasets: [
          { label: 'Create', data: [], borderColor: '#198754', fill: false },
          { label: 'Update', data: [], borderColor: '#0d6efd', fill: false },
          { label: 'Delete', data: [], borderColor: '#dc3545', fill: false }
        ]},
        options: { responsive: true, plugins: { title: { display: true, text: 'Actions par semaine' } } }
      });
    },
    updateWeekChart() {
      if (!this.weekChart) return;

      const weekMap = {};
      this.history.forEach(h => {
        const d = new Date(h.created_at);
        const year = d.getFullYear();
        const week = this.getWeekNumber(d);
        const key = `${year}-S${week}`;
        if (!weekMap[key]) weekMap[key] = { create:0, update:0, delete:0 };
        if (weekMap[key][h.action] !== undefined) weekMap[key][h.action]++;
      });

      const labels = Object.keys(weekMap).sort();
      const createData = labels.map(l => weekMap[l].create);
      const updateData = labels.map(l => weekMap[l].update);
      const deleteData = labels.map(l => weekMap[l].delete);

      this.weekChart.data.labels = labels;
      this.weekChart.data.datasets[0].data = createData;
      this.weekChart.data.datasets[1].data = updateData;
      this.weekChart.data.datasets[2].data = deleteData;
      this.weekChart.update();
    },

    getWeekNumber(d) {
      const date = new Date(d.getTime());
      date.setHours(0,0,0,0);
      date.setDate(date.getDate() + 4 - (date.getDay()||7));
      const yearStart = new Date(date.getFullYear(),0,1);
      return Math.ceil((((date - yearStart)/86400000)+1)/7);
    },

    // ===== EXPORT CSV =====
    exportCSV() {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Date,Table,Action,Numéro,Utilisateur,Description\n";

      if(this.history.length === 0) {
        csvContent += "Aucun mouvement disponible,,,,,\n";
      } else {
        this.history.forEach(h => {
          const row = [
            this.formatDate(h.created_at),
            h.table_name,
            h.action,
            h.record_id,
            h.username,
            `"${h.description || ''}"`
          ].join(",");
          csvContent += row + "\n";
        });
      }

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "historique_complet.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    // ===== EXPORT PDF =====
async exportPDF() {
  const doc = new jsPDF('p', 'pt', 'a4');

  const pageWidth = doc.internal.pageSize.getWidth();
  const topMargin = 40;

  // --- LOGO CENTRÉ ---
  try {
    const imgData = await this.getImageDataUrl("/chec2.png");
    if (imgData) {
      const logoWidth = 60;
      const logoHeight = 60;
      doc.addImage(imgData, "PNG", (pageWidth - logoWidth)/2, topMargin, logoWidth, logoHeight);
    }
  } catch(e) {
    console.warn("Logo non chargé :", e);
  }

  // --- TITRE ---
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0, 51, 153);
  doc.text("Historique des mouvements", pageWidth / 2, topMargin + 80, { align: 'center' });

  // --- TABLEAU ---
  let rows;
  if(this.history.length === 0){
    rows = [["Aucun mouvement disponible"]];
    autoTable(doc, {
      head: [['Message']],
      body: rows,
      startY: topMargin + 110,
      theme: 'grid',
      headStyles: { fillColor: [0, 102, 204], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 11, cellPadding: 5 }
    });
  } else {
    rows = this.history.map((h, index) => [
      index + 1, // Numéro
      this.formatDate(h.created_at),
      h.table_name,
      h.action,
      h.record_id,
      h.username,
      h.description || ''
    ]);

    autoTable(doc, {
      head: [['#','Date','Table','Action','Numéro','Utilisateur','Description']],
      body: rows,
      startY: topMargin + 110,
      theme: 'grid', // Bordures visibles
      headStyles: { fillColor: [0, 102, 204], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 10, cellPadding: 5 },
      didParseCell: (data) => {
        // Couleur de la colonne Action
        if(data.section === 'body' && data.column.index === 3) {
          const action = data.cell.raw.toLowerCase();
          if(action === 'create') data.cell.styles.textColor = [25, 135, 84]; // vert
          if(action === 'update') data.cell.styles.textColor = [13, 110, 253]; // bleu
          if(action === 'delete') data.cell.styles.textColor = [220, 53, 69]; // rouge
        }
      },
      didDrawPage: (data) => {
        // Pied de page
        const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;
        const pageCount = doc.internal.getNumberOfPages();
        const dateStr = new Date().toLocaleDateString('fr-FR');

        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`Page ${pageNumber} / ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 15, { align: 'center' });
        doc.text(`Généré le : ${dateStr}`, 40, doc.internal.pageSize.getHeight() - 15);
      }
    });
  }

  doc.save("historique_complet.pdf");
},

// --- UTILITAIRE POUR CHARGER L'IMAGE ---
async getImageDataUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = url;
  });
}



  },
  mounted() {
    this.initTableChart();
    this.initWeekChart();
  }
};
</script>

<style scoped>
.pagination .page-link {
  padding: 8px 14px;
  border-radius: 6px;
  font-weight: 500;
}

.pagination .page-item.active .page-link {
  background-color: #0d6efd;  /* Bleu Bootstrap */
  border-color: #0d6efd;
  color: white;
}

.pagination .page-item.disabled .page-link {
  opacity: 0.5;
  cursor: not-allowed;
}

.table th, .table td { vertical-align: middle; }
</style>
