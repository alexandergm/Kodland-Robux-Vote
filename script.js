// Функция для отправки данных в Telegram
function sendToTelegram(message) {
   const botToken = '7692253790:AAHKWsC-lNlg_G9FYx282NUH7wvMLDslqH0'; 
  const chatId = '639414462'; 
  const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

  // Отправляем сообщение через Telegram API
  fetch(telegramApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML', // Позволяет использовать форматирование текста
    }),
  })
    .then((response) => {
      if (response.ok) {
        console.log('Сообщение успешно отправлено в Telegram');
      } else {
        console.error('Ошибка отправки сообщения в Telegram', response);
      }
    })
    .catch((error) => {
      console.error('Ошибка подключения к Telegram API', error);
    });
}

// Функция для скрытия всей страницы (кроме логотипа и таблицы)
function showResults() {
  const votingForm = document.getElementById('voting-form');
  const results = document.getElementById('results');

  // Скрываем всю форму голосования и блоки учеников
  votingForm.classList.add('hidden');

  // Показываем только таблицу с результатами
  results.classList.remove('hidden');
}

// Функция для инициализации списка количества учеников
function initializeStudentCount() {
  const studentCountSelect = document.getElementById('student-count');

  // Очищаем список, если в нем что-то есть
  studentCountSelect.innerHTML = '<option value="">Выберите</option>';

  // Генерируем числа от 1 до 15
  for (let i = 1; i <= 15; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = i;
    studentCountSelect.appendChild(option);
  }
}

// Функция для создания блоков учеников в зависимости от выбранного числа
function generateStudentBlocks() {
  const studentCount = parseInt(document.getElementById('student-count').value, 10);
  const studentBlocks = document.getElementById('student-blocks');
  studentBlocks.innerHTML = '';

  if (isNaN(studentCount) || studentCount <= 0) return;

  // Создаем блоки для каждого ученика
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
        ${Array.from({ length: 15 }, (_, j) => `<option value="${j + 1}">${j + 1}</option>`).join('')}
      </select>
    `;
    studentBlocks.appendChild(block);
  }
}

// Функция для генерации результатов голосования
function generateResults() {
  const groupNumber = document.getElementById('group-number').value;
  const teacherName = document.getElementById('teacher-name').value;
  const studentBlocks = document.querySelectorAll('.student-block');
  const currentDate = new Date().toLocaleString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }); // Форматирование даты

  const results = [];
  studentBlocks.forEach((block, index) => {
    const name = block.querySelector(`input[name="student-name-${index + 1}"]`).value;
    const visualScores = block.querySelectorAll(`input[name^="visual-score-${index + 1}"]`);
    const visualScoreTotal = Array.from(visualScores).reduce((sum, input) => sum + parseInt(input.value || '0', 10), 0);
    const rank = parseInt(block.querySelector(`select[name="rank-${index + 1}"]`).value, 10);

    // Рассчитываем баллы за место в рейтинге
    const rankScore = rank === 1 ? 16 : rank === 2 ? 13 : rank === 3 ? 11 : rank === 4 ? 8 : rank === 5 ? 6 : 4;
    const totalScore = visualScoreTotal + rankScore;

    results.push({ name, totalScore });
  });

  // Сортируем результаты по убыванию баллов
  results.sort((a, b) => b.totalScore - a.totalScore);

  // Обрабатываем случай одинакового количества баллов на первом месте
  if (results.length > 1 && results[0].totalScore === results[1].totalScore) {
    results[0].totalScore += 1; // Добавляем 1 балл случайному первому участнику
  }

  // Генерируем таблицу лидеров
  const resultsSection = document.getElementById('results');
  const leaderboard = document.getElementById('leaderboard').querySelector('tbody');

  // Отображаем номер группы над таблицей
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

  // Создаем сообщение для Telegram
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

  // Отправляем сообщение в Telegram
  sendToTelegram(message);
}

// Добавляем обработчики событий
document.addEventListener('DOMContentLoaded', () => {
  initializeStudentCount(); // Инициализация списка количества учеников

  document.getElementById('student-count').addEventListener('change', generateStudentBlocks);
  document.getElementById('generate-results').addEventListener('click', () => {
    generateResults();
    showResults();
  });
});
