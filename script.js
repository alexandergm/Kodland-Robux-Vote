function sendToTelegram(message) {
  const botToken = '7692253790:AAHKWsC-lNlg_G9FYx282NUH7wvMLDslqH0';
  const chatId = '639414462';
  const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

  fetch(telegramApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    }),
  });
}

function showResults() {
  const votingForm = document.getElementById('voting-form');
  const resultsSection = document.getElementById('results');
  votingForm.classList.add('hidden');
  resultsSection.classList.remove('hidden');
}

function initializeStudentCount() {
  const studentCountSelect = document.getElementById('student-count');
  studentCountSelect.innerHTML = '<option value="">Выберите</option>';
  for (let i = 1; i <= 15; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = i;
    studentCountSelect.appendChild(option);
  }
}

function generateStudentBlocks() {
  const studentCount = parseInt(document.getElementById('student-count').value, 10);
  const studentBlocks = document.getElementById('student-blocks');
  studentBlocks.innerHTML = '';
  if (isNaN(studentCount) || studentCount <= 0) return;
  for (let i = 1; i <= studentCount; i++) {
    const block = document.createElement('div');
    block.className = 'student-block';
    block.innerHTML = `
      <h3>Ученик ${i}</h3>
      <label>Имя ученика:</label>
      <input type="text" name="student-name-${i}" required>
      <label>Оценка за визуальную часть (от 1 до 5):</label>
      <div class="visual-scores">
        ${Array.from({ length: studentCount - 1 }, (_, j) => `
          <input type="number" name="visual-score-${i}-${j + 1}" min="1" max="5" required>
        `).join('')}
      </div>
      <label>Место в рейтинге:</label>
      <select name="rank-${i}" required>
        <option value="">Выберите</option>
        ${Array.from({ length: 15 }, (_, j) => `<option value="${j + 1}">${j + 1}</option>`).join('')}
      </select>
    `;
    studentBlocks.appendChild(block);
  }
  addInputListeners();
}

function validateFields() {
  let isValid = true;
  const allFields = document.querySelectorAll('#voting-form input, #voting-form select');
  allFields.forEach((field) => field.classList.remove('error'));
  allFields.forEach((field) => {
    if (!field.value || (field.type === 'number' && (field.value < 1 || field.value > 5))) {
      field.classList.add('error');
      isValid = false;
    }
  });
  return isValid;
}

function addInputListeners() {
  const allFields = document.querySelectorAll('#voting-form input, #voting-form select');
  allFields.forEach((field) => {
    field.addEventListener('input', () => {
      if (field.value && (field.type !== 'number' || (field.value >= 1 && field.value <= 5))) {
        field.classList.remove('error');
      }
    });
  });
}

function generateResults() {
  if (!validateFields()) {
    alert('Заполните все обязательные поля!');
    return;
  }

  const groupNumber = document.getElementById('group-number').value;
  const teacherName = document.getElementById('teacher-name').value;
  const studentBlocks = document.querySelectorAll('.student-block');
  const currentDate = new Date().toLocaleString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const results = [];
  studentBlocks.forEach((block, index) => {
    const name = block.querySelector(`input[name="student-name-${index + 1}"]`).value;
    const visualScores = block.querySelectorAll(`input[name^="visual-score-${index + 1}"]`);
    const visualScoreTotal = Array.from(visualScores).reduce((sum, input) => sum + parseInt(input.value || '0', 10), 0);
    const rank = parseInt(block.querySelector(`select[name="rank-${index + 1}"]`).value, 10);

    const rankScore = rank === 1 ? 16 : rank === 2 ? 13 : rank === 3 ? 11 : rank === 4 ? 8 : rank === 5 ? 6 : 4;
    const totalScore = visualScoreTotal + rankScore;

    results.push({ name, totalScore });
  });

  results.sort((a, b) => b.totalScore - a.totalScore);

  if (results.length > 1 && results[0].totalScore === results[1].totalScore) {
    results[0].totalScore += 1;
  }

  const resultsSection = document.getElementById('results');
  const leaderboard = document.getElementById('leaderboard').querySelector('tbody');

  resultsSection.querySelector('h2').innerHTML = `Таблица лидеров (Группа ${groupNumber})`;

  leaderboard.innerHTML = results
    .map(
      (result) =>
        `<tr>
          <td>${result.name}</td>
          <td>${result.totalScore}</td>
        </tr>`
    )
    .join('');

  const message = `<b>Таблица лидеров</b>\n` +
    `Группа: ${groupNumber}\n` +
    `Преподаватель: ${teacherName}\n` +
    `Дата: ${currentDate}\n\n` +
    results
      .map(
        (result, index) =>
          `${index + 1}. ${result.name} - ${result.totalScore} баллов`
      )
      .join('\n');

  sendToTelegram(message);
  showResults();
}

document.addEventListener('DOMContentLoaded', () => {
  initializeStudentCount();
  document.getElementById('student-count').addEventListener('change', generateStudentBlocks);
  document.getElementById('generate-results').addEventListener('click', generateResults);
});
