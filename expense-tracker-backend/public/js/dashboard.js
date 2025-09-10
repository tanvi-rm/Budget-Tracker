function initializeDashboard() {
  loadUserProfile();
  loadPage('dashboard');
}

function loadStats() {
  fetch('/api/stats/summary')
    .then(res => res.json())
    .then(data => {
      if (data.error) throw new Error(data.error);

      // Update stat cards
      document.getElementById('total-balance').textContent = `₹${data.totalBalance}`;
      document.getElementById('total-income').textContent = `₹${data.totalIncome}`;
      document.getElementById('total-expense').textContent = `₹${data.totalExpense}`;

      // Update the donut chart
      renderPieChart(data.totalIncome, data.totalExpense);
    })
    .catch(err => {
      console.error('Failed to load stats:', err);
    });
}

function renderPieChart(income, expense) {
  const chart = echarts.init(document.getElementById('overview-pie-chart'));

  const balance = income - expense;

  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
  orient: 'horizontal',
  bottom: 0,
  left: 'center',
  textStyle: {
    fontSize: 14
  }
},
    series: [
      {
        name: 'Financial Overview',
        type: 'pie',
        radius: ['40%', '80%'], // tighter donut
        center: ['50%', '45%'],   // perfect center

        avoidLabelOverlap: false,
        label: {
          show: true,
          position: 'center',
          formatter: `Balance\n₹${balance}`,
          fontSize: 16,
          fontWeight: 'bold'
        },
        labelLine: {
          show: false
        },
        data: [
          { value: income, name: 'Income', itemStyle: { color: '#4B6CB7' } },
          { value: expense, name: 'Expense', itemStyle: { color: '#E74C3C' }  }
        ]
      }
    ],
    grid: {
  left: 0,
  right: 0,
  top: 10,
  bottom: 10,
  containLabel: true
},

  };

  chart.setOption(option);
}


loadStats(); // Call this when the page loads
function loadRecentTransactions() {
  fetch('/api/stats/recent-transactions')
    .then(res => res.json())
    .then(data => {
      const container = document.querySelector('.transactions');
      container.innerHTML = '<h3>Recent Transactions</h3>'; // Clear and add heading

      if (!data || data.length === 0) {
        container.innerHTML += '<p>No recent transactions.</p>';
        return;
      }

      data.forEach(tx => {
        const dateObj = new Date(tx.date);
        const formattedDate = `${dateObj.getDate()} ${dateObj.toLocaleString('default', { month: 'short' })} ${dateObj.getFullYear()}`;

        const amountClass = tx.type === 'expense' ? 'red' : 'green';
        const amountSign = tx.type === 'expense' ? '-' : '+';

        const html = `
          <div class="transaction">
            <div>
              <strong>${tx.source}</strong>
              <div>${formattedDate}</div>
            </div>
            <span class="amount ${amountClass}">${amountSign}₹${tx.amount}</span>
          </div>
        `;
        container.innerHTML += html;
      });
    })
    .catch(err => {
      console.error('Failed to load recent transactions:', err);
    });
}




async function loadUserProfile() {
  try {
    const res = await fetch('/api/user/profile');
    if (!res.ok) {
      throw new Error('Not authenticated');
    }

    const data = await res.json();

    const nameElem = document.querySelector('.user-name');
    const imgElem = document.querySelector('.profile-img');

    if (data.fullName) {
      nameElem.textContent = data.fullName;
    }

    if (data.avatar) {
      imgElem.src = data.avatar;
    } else {
      imgElem.src = 'assets/sigin.jpg'; // fallback if no avatar
    }

  } catch (error) {
    console.error('Error loading profile:', error);
    document.querySelector('.user-name').textContent = 'Guest';
    document.querySelector('.profile-img').src = 'assets/sigin.jpg';
  }
}


function loadPage(page) {
  const mainContent = document.getElementById('main-content');

 if (page === 'logout') {
    logoutUser();
    return;
  }

  // Update active button
  const buttons = document.querySelectorAll('.sidebar button');
  buttons.forEach(btn => btn.classList.remove('active'));
  const activeButton = Array.from(buttons).find(btn => btn.getAttribute('onclick')?.includes(page));
  if (activeButton) {
    activeButton.classList.add('active');
  }

  if (page === 'dashboard') {
    mainContent.innerHTML = `
      <div class="stats">
  <div class="stat-box">
    <img src="assets/balance.png"/>
    <div>
      <small>Total Balance</small>
      <div><strong id="total-balance">₹0</strong></div>
    </div>
  </div>
  <div class="stat-box">
    <img src="assets/income.png"/>
    <div>
      <small>Total Income</small>
      <div><strong id="total-income">₹0</strong></div>
    </div>
  </div>
  <div class="stat-box">
    <img src="assets/expense.png"/>
    <div>
      <small>Total Expense</small>
      <div><strong id="total-expense">₹0</strong></div>
    </div>
  </div>
</div>


      <div class="row">
        <div class="transactions">
          <h3>Recent Transactions</h3>
          
        </div>
        <div class="chart-box">
          <h3>Financial Overview</h3>
          <div id="overview-pie-chart" style="width: 300px; height: 300px;"></div>
        </div>
      </div>

      <div class="row">
        <div class="chart-box">
          <h3>Last 30 Days Income</h3>
          <canvas id="lastIncomeChart" width="280" height="280"></canvas>
        </div>
        <div class="chart-box">
          <h3>Last 30 Days Expenses</h3>
          <canvas id="lastExpenseChart" width="280" height="280"></canvas>
        </div>
      </div>
    `;
    loadStats(); // Call this when the page loads
    loadRecentTransactions(); // Call when page loads
    loadIncomeChart();
    loadExpenseChart();
    

    let incomeChart = null;

   function loadIncomeChart() {
  const now = new Date();
  const month = now.getMonth(); // 0-based
  const year = now.getFullYear();

  fetch('/api/income/all')
    .then(res => res.json())
    .then(data => {
      // Filter incomes for the current month
      const filtered = data.filter(item => {
        const date = new Date(item.date);
        return date.getMonth() === month && date.getFullYear() === year;
      });

      // Group by category
      const categoryMap = {};
      filtered.forEach(item => {
        if (!categoryMap[item.category]) {
          categoryMap[item.category] = 0;
        }
        categoryMap[item.category] += item.amount;
      });

      const labels = Object.keys(categoryMap);
      const values = Object.values(categoryMap);
      const colors = ['#a259ff', '#ff6384', '#ffa500', '#00b894', '#fdcb6e', '#0984e3'];

      const ctx = document.getElementById('lastIncomeChart').getContext('2d');
      if (incomeChart) incomeChart.destroy();

      incomeChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: colors.slice(0, labels.length),
            hoverOffset: 6
          }]
        },
        options: {
          plugins: {
            legend: { position: 'bottom' },
            title: {
              display: true,
              text: `Income - ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}`
            }
          }
        }
      });
    })
    .catch(err => {
      console.error('Failed to load income chart data', err);
    });
}

    let expenseChart = null;

function loadExpenseChart() {
  fetch('/api/expense/stats/category-wise')
    .then(res => res.json())
    .then(data => {
      const labels = data.map(item => item._id);
      const values = data.map(item => item.totalAmount);
      const colors = ['#a259ff', '#ff6384', '#ffa500', '#00b894', '#fdcb6e', '#0984e3'];

      const ctx = document.getElementById('lastExpenseChart').getContext('2d');

      if (expenseChart) {
        expenseChart.destroy();
      }

      expenseChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Expenses',
            data: values,
            backgroundColor: 'rgba(132, 94, 247, 0.7)',
          }]
        },
        options: {
          scales: { y: { beginAtZero: true } },
          plugins: { legend: { display: false } }
        }
      });
    })
    .catch(err => console.error('Failed to load expense chart data', err));
}

  } else  if (page === 'income') {
    mainContent.innerHTML = `
      <div class="stats">
  <div class="stat-box">
    <img src="assets/balance.png"/>
    <div>
      <small>Total Balance</small>
      <div><strong id="total-balance">₹0</strong></div>
    </div>
  </div>
  <div class="stat-box">
    <img src="assets/income.png"/>
    <div>
      <small>Total Income</small>
      <div><strong id="total-income">₹0</strong></div>
    </div>
  </div>
  <div class="stat-box">
    <img src="assets/expense.png"/>
    <div>
      <small>Total Expense</small>
      <div><strong id="total-expense">₹0</strong></div>
    </div>
  </div>
</div>


      <div class="add-income-wrapper center-align">
        <button class="add-income-btn" id="openIncomeModal">+ Add Income</button>
      </div>

      <div class="transactions" id="incomeTransactions"></div>

      <div class="bottom-row">
        <div class="category-box">
          <select id="incomeCategoryDropdown"><option value="">All Categories</option></select>
          <div id="categoryTransactions" class="category-transactions"></div>
        </div>
        <div class="chart-box">
          <h3>Last 30 Days Income</h3>
          <canvas id="lastIncomeChart" width="280" height="280"></canvas>
        </div>
      </div>

      <div id="incomeModal" class="modal-overlay" style="display:none;">
        <div class="modal">
          <span class="close-btn" id="closeIncomeModal">&times;</span>
          <h2>Add Income</h2>
          <label>Income Source</label>
          <input type="text" id="incomeSource" placeholder="Salary, Freelance, etc" />
          <label>Category</label>
          <input type="text" id="incomeCategory" placeholder="Category" />
          <div class="category-buttons">
            <button type="button" class="quick-income-category">Salary</button>
            <button type="button" class="quick-income-category">Freelance</button>
            <button type="button" class="quick-income-category">Bonus</button>
            <button type="button" class="quick-income-category">Other</button>
          </div>
          <label>Amount</label>
          <input type="number" id="incomeAmount" placeholder="Enter amount" />
          <label>Date</label>
          <input type="date" id="incomeDate" />
          <button class="add-income-submit">Add Income</button>
        </div>
      </div>
    `;
    loadStats(); // Call this when the page loads

    let incomeChart = null;

   function loadIncomeChart() {
  const now = new Date();
  const month = now.getMonth(); // 0-based
  const year = now.getFullYear();

  fetch('/api/income/all')
    .then(res => res.json())
    .then(data => {
      // Filter incomes for the current month
      const filtered = data.filter(item => {
        const date = new Date(item.date);
        return date.getMonth() === month && date.getFullYear() === year;
      });

      // Group by category
      const categoryMap = {};
      filtered.forEach(item => {
        if (!categoryMap[item.category]) {
          categoryMap[item.category] = 0;
        }
        categoryMap[item.category] += item.amount;
      });

      const labels = Object.keys(categoryMap);
      const values = Object.values(categoryMap);
      const colors = ['#a259ff', '#ff6384', '#ffa500', '#00b894', '#fdcb6e', '#0984e3'];

      const ctx = document.getElementById('lastIncomeChart').getContext('2d');
      if (incomeChart) incomeChart.destroy();

      incomeChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: colors.slice(0, labels.length),
            hoverOffset: 6
          }]
        },
        options: {
          plugins: {
            legend: { position: 'bottom' },
            title: {
              display: true,
              text: `Income - ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}`
            }
          }
        }
      });
    })
    .catch(err => {
      console.error('Failed to load income chart data', err);
    });
}


    setTimeout(() => {
      const modal = document.getElementById('incomeModal');
      const dropdown = document.getElementById('incomeCategoryDropdown');
      const incomeContainer = document.getElementById('incomeTransactions');
      const categoryBox = document.getElementById('categoryTransactions');
      loadIncomeChart();


      const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      };

      const renderIncomes = (data, targetEl) => {
  targetEl.innerHTML = '';
  data.forEach(inc => {
    const div = document.createElement('div');
    div.className = 'transaction';
    div.innerHTML = `
      <span class="label">${inc.source}</span>
      <span class="transaction-date">${formatDate(inc.date)}</span>
      <span class="amount green">${inc.amount}</span>
    `;
    targetEl.appendChild(div);
  });
};

      const loadIncomeData = () => {
  fetch('/api/income/all')
    .then(res => res.json())
    .then(data => {
      incomeContainer.innerHTML = '';
      categoryBox.innerHTML = '';
      dropdown.innerHTML = '<option value="">All Categories</option>';

      const categories = new Set();

      // Show all incomes in #incomeTransactions
      renderIncomes(data, incomeContainer);

      // Populate dropdown with unique categories
      data.forEach(income => {
        const lowerCat = income.category.toLowerCase();
        if (!categories.has(lowerCat)) {
          categories.add(lowerCat);
          const option = document.createElement('option');
          option.value = income.category;
          option.textContent = income.category;
          dropdown.appendChild(option);
        }
      });

      // Handle category filter selection
      dropdown.onchange = () => {
        const selected = dropdown.value;
        const filtered = selected
          ? data.filter(i => i.category === selected)
          : data;
        renderIncomes(filtered, categoryBox);
      };

      // Also render all in category box initially
      renderIncomes(data, categoryBox);
    })
    .catch(err => {
      console.error('Error loading incomes:', err);
      incomeContainer.innerHTML = '<p style="color:red;">Failed to load income data.</p>';
    });
};


      document.getElementById('openIncomeModal').onclick = () => modal.style.display = 'flex';
      document.getElementById('closeIncomeModal').onclick = () => modal.style.display = 'none';
      window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

      document.querySelectorAll('.quick-income-category').forEach(btn => {
        btn.onclick = () => document.getElementById('incomeCategory').value = btn.textContent;
      });

      document.querySelector('.add-income-submit').onclick = async () => {
        const source = document.getElementById('incomeSource').value.trim();
        const category = document.getElementById('incomeCategory').value.trim();
        const amount = document.getElementById('incomeAmount').value.trim();
        const date = document.getElementById('incomeDate').value;

        if (!source || !category || !amount || !date) {
          alert('Please fill in all fields.');
          return;
        }

        try {
          const res = await fetch('/api/income/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ source, category, amount, date })
          });

          const result = await res.json();

          if (res.ok) {
            alert('Income saved!');
            const exists = Array.from(dropdown.options).some(
              option => option.value.toLowerCase() === category.toLowerCase()
            );
            if (!exists) {
              const opt = document.createElement('option');
              opt.value = category;
              opt.textContent = category;
              dropdown.appendChild(opt);
            }
            loadStats(); // Call this when the page loads
            loadIncomeData();
            loadIncomeChart();

          } else {
            alert(result.error || 'Failed to save income.');
          }
        } catch (err) {
          console.error('Add income error:', err);
          alert('Server error while saving income.');
        }

        modal.style.display = 'none';
        document.getElementById('incomeSource').value = '';
        document.getElementById('incomeCategory').value = '';
        document.getElementById('incomeAmount').value = '';
        document.getElementById('incomeDate').value = '';
      };

      loadIncomeData();
    }, 0);
  
}
    else if (page === 'expense') {
    mainContent.innerHTML = `
      <div class="stats">
  <div class="stat-box">
    <img src="assets/balance.png"/>
    <div>
      <small>Total Balance</small>
      <div><strong id="total-balance">₹0</strong></div>
    </div>
  </div>
  <div class="stat-box">
    <img src="assets/income.png"/>
    <div>
      <small>Total Income</small>
      <div><strong id="total-income">₹0</strong></div>
    </div>
  </div>
  <div class="stat-box">
    <img src="assets/expense.png"/>
    <div>
      <small>Total Expense</small>
      <div><strong id="total-expense">₹0</strong></div>
    </div>
  </div>
</div>


<div class="add-expense-wrapper" style="display: flex; justify-content: flex-end; margin-bottom: 10px;">
  <button class="add-expense-btn" id="openExpenseModal">+ ADD EXPENSE</button>
</div>


<div class="transactions" id="expenseTransactions"></div>


<div class="bottom-row">
  <div class="category-box">
  <select id="expenseCategoryDropdown">
  <option value="">All Categories</option>
</select>
  <div id="expenseCategoryBox" style="display: block; margin-top: 10px;"></div> 

</div>


  <div class="chart-box">
    <h3>Last 30 Days Expenses</h3>
    <canvas id="lastExpenseChart" width="280" height="280"></canvas>
  </div>
</div>


<!-- Modal -->
<div id="expenseModal" class="modal-overlay" style="display:none;">
  <div class="modal">
    <span class="close-btn" id="closeExpenseModal">&times;</span>
    <h2>Add Expense</h2>

    <label>Expense Source</label>
    <input type="text" id="expenseSource" placeholder="Food, Travel, etc" />

    <label>Category</label>
    <input type="text" id="expenseCategory" placeholder="Category" />

    <div class="category-buttons">
      <button type="button" class="quick-expense-category">Travel</button>
      <button type="button" class="quick-expense-category">Food</button>
      <button type="button" class="quick-expense-category">Grocery</button>
      <button type="button" class="quick-expense-category">Trip</button>
    </div>

    <label>Amount</label>
    <input type="number" id="expenseAmount" placeholder="Enter amount" />

    <label>Date</label>
    <input type="date" id="expenseDate" />

    <button class="add-expense-submit">Add Expense</button>
  </div>
</div>

    `;
    loadStats(); // Call this when the page loads

    let expenseChart = null;

function loadExpenseChart() {
  fetch('/api/expense/stats/category-wise')
    .then(res => res.json())
    .then(data => {
      const labels = data.map(item => item._id);
      const values = data.map(item => item.totalAmount);
      const colors = ['#a259ff', '#ff6384', '#ffa500', '#00b894', '#fdcb6e', '#0984e3'];

      const ctx = document.getElementById('lastExpenseChart').getContext('2d');

      if (expenseChart) {
        expenseChart.destroy();
      }

      expenseChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Expenses',
            data: values,
            backgroundColor: 'rgba(132, 94, 247, 0.7)',
          }]
        },
        options: {
          scales: { y: { beginAtZero: true } },
          plugins: { legend: { display: false } }
        }
      });
    })
    .catch(err => console.error('Failed to load expense chart data', err));
}


setTimeout(() => {
  const modal = document.getElementById('expenseModal');
  const openBtn = document.getElementById('openExpenseModal');
  const closeBtn = document.getElementById('closeExpenseModal');
  const dropdown = document.getElementById('expenseCategoryDropdown');
  const container = document.getElementById('expenseTransactions');

  loadStats(); // Call this when the page loads
  loadExpenses();     
  loadExpenseChart();

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}-${d.toLocaleString('default', { month: 'short' })}-${d.getFullYear()}`;
  }

  function loadExpenses() {
  fetch('/api/expense/all')
    .then(res => res.json())
    .then(data => {
      const dropdown = document.getElementById('expenseCategoryDropdown');
      const categoryBox = document.getElementById('expenseCategoryBox');
      const allBox = document.getElementById('expenseTransactions');

      dropdown.innerHTML = '<option value="">All Categories</option>';
      categoryBox.innerHTML = '';
      allBox.innerHTML = '';

      const categories = new Set();
      data.forEach(exp => categories.add(exp.category.toLowerCase()));

      categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        dropdown.appendChild(opt);
      });

      // Initial render: show all expenses in both boxes
      renderExpenses(data, allBox);
      renderExpenses(data, categoryBox);

      dropdown.addEventListener('change', () => {
        const selected = dropdown.value;
        const filtered = selected === ''
          ? data
          : data.filter(exp => exp.category.toLowerCase() === selected.toLowerCase());

        renderExpenses(filtered, categoryBox);
      });

      function renderExpenses(list, target) {
        target.innerHTML = '';
        list.forEach(exp => {
          const html = `
            <div class="transaction">
              <span class="label">${exp.source}</span>
              <span class="transaction-date">${formatDate(exp.date)}</span>
              <span class="amount red">${exp.amount}</span>
            </div>
          `;
          target.insertAdjacentHTML('beforeend', html);
        });
      }
    })
    .catch(err => {
      console.error('Failed to load expenses:', err);
    });
}


  // Modal logic
  openBtn.onclick = () => modal.style.display = 'flex';
  closeBtn.onclick = () => modal.style.display = 'none';
  window.onclick = e => { if (e.target === modal) modal.style.display = 'none'; };

  // Quick-fill buttons
  document.querySelectorAll('.quick-expense-category').forEach(btn => {
    btn.onclick = () => document.getElementById('expenseCategory').value = btn.textContent;
  });

  // Submit logic
  document.querySelector('.add-expense-submit').onclick = async () => {
    const source = document.getElementById('expenseSource').value.trim();
    const category = document.getElementById('expenseCategory').value.trim();
    const amount = document.getElementById('expenseAmount').value.trim();
    const date = document.getElementById('expenseDate').value;

    if (!source || !category || !amount || !date) {
      alert('Please fill all fields');
      return;
    }

    const res = await fetch('/api/expense/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, category, amount, date })
    });

    const result = await res.json();

    if (res.ok) {
      alert('Expense added!');
      loadStats(); // Call this when the page loads
      loadExpenses();
      loadExpenseChart() 
    } else {
      alert(result.error || 'Failed to add expense');
    }

    modal.style.display = 'none';
    document.getElementById('expenseSource').value = '';
    document.getElementById('expenseCategory').value = '';
    document.getElementById('expenseAmount').value = '';
    document.getElementById('expenseDate').value = '';
  };

  loadExpenses();
}, 0);

    }
  }

function showLogoutModal() {
  document.getElementById('logout-modal').classList.remove('hidden');
}

function hideLogoutModal() {
  document.getElementById('logout-modal').classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  const confirmLogoutBtn = document.getElementById('confirm-logout');
  const cancelLogoutBtn = document.getElementById('cancel-logout');

  confirmLogoutBtn.addEventListener('click', () => {
    fetch('/api/user/logout', {
      method: 'POST',
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          window.location.href = '/';
        } else {
          alert('Logout failed');
        }
      })
      .catch(err => {
        console.error('Logout error:', err);
      });
  });

  cancelLogoutBtn.addEventListener('click', hideLogoutModal);
});
