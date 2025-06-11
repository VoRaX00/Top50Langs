document.addEventListener("DOMContentLoaded", function () {
    createTable(languages, 'list');

    let findButton = document.querySelector('input[value="Найти"]');

    if (findButton) {
        findButton.addEventListener("click", function () {
            // Получаем форму с фильтрами
            let filterForm = document.getElementById("filter");
            filterTable(languages, 'list', filterForm);
            draw()
        });
    }

    let clearButton = document.querySelector('input[value="Очистить фильтры"]');

    if (clearButton) {
        clearButton.addEventListener("click", function () {
            // Получаем форму с фильтрами
            let filterForm = document.getElementById("filter");
            clearFilter('list', languages, filterForm);
            draw()
        });
    }

    // Инициализация полей сортировки
    let sortForm = document.getElementById("sort");
    if (sortForm && languages.length > 0) {
        setSortSelects(languages[0], sortForm);

        let fieldsFirst = document.getElementById("fieldsFirst");

        // Добавляем обработчик события change для первого уровня сортировки
        if (fieldsFirst) {
            fieldsFirst.addEventListener("change", function () {
                // Настраиваем поле для второго уровня сортировки
                changeNextSelect("fieldsSecond", fieldsFirst);
            });
        }

        // Находим поле для второго уровня сортировки
        let fieldsSecond = document.getElementById("fieldsSecond");

        // Добавляем обработчик события change для второго уровня сортировки
        if (fieldsSecond) {
            fieldsSecond.addEventListener("change", function () {
                // Настраиваем поле для третьего уровня сортировки
                changeNextSelect("fieldsThird", fieldsSecond);
                draw()
            });
        }

        // Находим кнопку "Сортировать" по её значению (value)
        let sortButton = document.querySelector('input[value="Сортировать"]');

        // Добавляем обработчик события click для кнопки "Сортировать"
        if (sortButton) {
            sortButton.addEventListener("click", function () {
                // Вызываем функцию sortTable с параметрами
                sortTable('list', sortForm);
                draw()
            });
        }

        let resetSortButton = document.querySelector('input[value="Сбросить сортировку"]');

        if (resetSortButton) {
            resetSortButton.addEventListener("click", function () {
                // Вызываем функцию resetSort с параметрами
                resetSort('list', sortForm);
                draw()
            });
        }
    }

    let drawButton = d3.select("#draw");
    drawButton.on("click", function () {
        draw();
    });

});

function draw() {
    d3.select("#maxUsers").on("change", handleCheckboxChange);
    d3.select("#minUsers").on("change", handleCheckboxChange);

    let maxUsers = d3.select("#maxUsers").node().checked;
    let minUsers = d3.select("#minUsers").node().checked;

    if (!maxUsers && !minUsers) {
        d3.select("#error-message")
            .text("Выберите хотя бы одно значение по OY")
            .style("color", "red");

        d3.select("#tcheck1").style("color", "red");
        d3.select("#tcheck2").style("color", "red");
        return;
    }

    // Очистка ошибок
    d3.select("#error-message").text("");
    d3.select("#tcheck1").style("color", "");
    d3.select("#tcheck2").style("color", "");

    // Получаем отфильтрованные данные из таблицы
    const filteredData = getFilteredDataFromTable();

    if (filteredData.length === 0) {
        d3.select("#error-message")
            .text("Нет данных для отображения! Проверьте фильтры.")
            .style("color", "red");
        return;
    }

    // Рисуем график
    drawGraph(filteredData);
}

function handleCheckboxChange() {
    const maxUsers = d3.select("#maxUsers").node().checked;
    const minUsers = d3.select("#minUsers").node().checked;

    if (maxUsers || minUsers) {
        d3.select("#error-message").text("");
        d3.select("#tcheck1").style("color", "");
        d3.select("#tcheck2").style("color", "");
    }
}

function getFilteredDataFromTable() {
    let table = document.getElementById("list");
    let rows = table.rows;
    let filteredData = [];

    // Пропускаем заголовок (первую строку)
    for (let i = 1; i < rows.length; i++) {
        let cells = rows[i].cells;
        filteredData.push({
            "Место": parseInt(cells[0].textContent),
            "Название языка": cells[1].textContent,
            "Год создания": parseInt(cells[2].textContent),
            "Создатели": cells[3].textContent,
            "Тип исполнения": cells[4].textContent,
            "Кол-во пользователей": parseInt(cells[5].textContent),
            "Скорость работы, с": parseFloat(cells[6].textContent),
        });
    }

    return filteredData;
}

// Функция для создания одной опции в select
let createOption = (str, val) => {
    let item = document.createElement('option');
    item.text = str;
    item.value = val;
    return item;
};

// Функция для заполнения select опциями
let setSortSelect = (arr, sortSelect) => {
    // Создаем OPTION "Нет" и добавляем её в SELECT
    sortSelect.append(createOption('Нет', 0));

    // Перебираем все элементы массива и создаем OPTION для каждого
    for (let i in arr) {
        // Значение атрибута VAL увеличиваем на 1, так как значение 0 имеет опция "Нет"
        sortSelect.append(createOption(arr[i], Number(i) + 1));
    }
};

// Функция для формирования полей со списком для многоуровневой сортировки
let setSortSelects = (data, dataForm) => {

    let head = Object.keys(data);

    let allSelect = dataForm.getElementsByTagName('select');
    for (let j = 0; j < allSelect.length; j++) {
        setSortSelect(head, allSelect[j]);

        if (j > 0) {
            allSelect[j].disabled = true;
        }
    }
};

// Настраиваем поле для следующего уровня сортировки и отключаем все последующие, если выбрано "Нет"
let changeNextSelect = (nextSelectId, curSelect) => {
    let nextSelect = document.getElementById(nextSelectId);

    // Если текущий выбор - "Нет" (значение 0), отключаем ВСЕ последующие select
    if (curSelect.value === 0) {
        let allSelects = document.querySelectorAll('#sort select');
        let foundCurrent = false;

        allSelects.forEach(select => {
            if (select === curSelect) {
                foundCurrent = true;
            } else if (foundCurrent) {
                select.disabled = true;
                select.selectedIndex = 0; // Сбрасываем выбор
            }
        });
        return;
    }

    nextSelect.disabled = false;
    nextSelect.innerHTML = curSelect.innerHTML;
    nextSelect.remove(curSelect.value);
};