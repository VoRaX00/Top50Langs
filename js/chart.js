// Входные данные:
// data - исходный массив (например, buildings)
// key - поле, по которому осуществляется группировка
function createArrGraph(data, key) {
    groupObj = d3.group(data, d => d[key]);
    let arrGraph = [];
    for (let entry of groupObj) {
        let minMax = d3.extent(entry[1].map(d => d['Кол-во пользователей']));
        arrGraph.push({labelX: entry[0], values: minMax});
    }
    return arrGraph;
}

// Основная функция отрисовки графика
function drawGraph(data) {
    let keyX = d3.select('input[name="ox"]:checked').node().value;
    const arrGraph = createArrGraph(data, keyX);
    arrGraph.sort((a, b) => d3.ascending(a.labelX, b.labelX));

    let svg = d3.select("svg")
    svg.selectAll('*').remove();

    // Определяем размеры и отступы области графика
    attr_area = {
        width: parseFloat(svg.style('width')),
        height: parseFloat(svg.style('height')),
        marginX: 50,
        marginY: 50
    }

    // создаем шкалы преобразования и выводим оси
    const [scX, scY] = createAxis(svg, arrGraph, attr_area);

    // Определяем тип графика (гистограмма или точки)
    let sel = d3.select("#type").node().value;
    if (sel === "gist") {
        createChartGist(svg, arrGraph, scX, scY, attr_area, "red");
    } else if (sel === "point") {
        createChartDot(svg, arrGraph, scX, scY, attr_area, "red");
    } else {
        createChartLine(svg, arrGraph, scX, scY, attr_area, "red")
    }
}

// Функция создания осей и шкал преобразования
function createAxis(svg, data, attr_area) {
    let maxUsers = d3.select("#maxUsers").node().checked;
    let minUsers = d3.select("#minUsers").node().checked;
    let valuesToDisplay = [];

    if (maxUsers) {
        valuesToDisplay = valuesToDisplay.concat(data.map(d => d.values[1]));
    }
    if (minUsers) {
        valuesToDisplay = valuesToDisplay.concat(data.map(d => d.values[0]));
    }
    // Определяем минимальное и максимальное значение по оси Y
    let [min, max] = d3.extent(valuesToDisplay);



    let scaleX = d3.scaleBand()
        .domain(data.map(d => d.labelX).sort())
        .range([0, attr_area.width - 2 * attr_area.marginX]);

    // Шкала для оси Y
    let scaleY = d3.scaleLinear()
        .domain([min * 0.85, max * 1.1])
        .range([attr_area.height - 2 * attr_area.marginY, 0]);

    // Создание и отрисовка осей
    let axisX = d3.axisBottom(scaleX);
    let axisY = d3.axisLeft(scaleY);

    svg.append("g")
        .attr("transform", `translate(${attr_area.marginX}, ${attr_area.height - attr_area.marginY})`)
        .call(axisX)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", d => "rotate(-45)");

    svg.append("g")
        .attr("transform", `translate(${attr_area.marginX}, ${attr_area.marginY})`)
        .call(axisY);

    return [scaleX, scaleY];
}

// Функция создания гистограммы
function createChartGist(svg, data, scaleX, scaleY, attr_area, color) {
    let check1 = d3.select("#maxUsers").node().checked; // чекбокс "макс"
    let check2 = d3.select("#minUsers").node().checked; // чекбокс "мин"

    // Если оба чекбокса включены, рисуем оба столбца
    if (check1 && check2) {
        createGist(svg, data, scaleX, scaleY, attr_area, "red", d => scaleY(d.values[1]), 2);
        createGist(svg, data, scaleX, scaleY, attr_area, "blue", d => scaleY(d.values[0]), -2);
    } else if (check1) {
        createGist(svg, data, scaleX, scaleY, attr_area, "red", d => scaleY(d.values[1]));
    } else if (check2) {
        createGist(svg, data, scaleX, scaleY, attr_area, "blue", d => scaleY(d.values[0]));
    }
}

// Функция создания точечной диаграммы
function createChartDot(svg, data, scaleX, scaleY, attr_area, color) {
    let maxUsers = d3.select("#maxUsers").node().checked;
    let minUsers = d3.select("#minUsers").node().checked;

    if (maxUsers && minUsers) {
        createDot(svg, data, scaleX, attr_area, "red", d => scaleY(d.values[1]), 2);
        createDot(svg, data, scaleX, attr_area, "blue", d => scaleY(d.values[0]), -2);
    } else if (maxUsers) {
        createDot(svg, data, scaleX, attr_area, "red", d => scaleY(d.values[1]));
    } else if (minUsers) {
        createDot(svg, data, scaleX, attr_area, "blue", d => scaleY(d.values[0]));
    }
}

// Функция рисует точки
function createDot(svg, data, scaleX, attr_area, color, value, shift = 0) {
    const r = 4;
    svg.selectAll(".dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("r", r)
        .attr("cx", d => scaleX(d.labelX) + scaleX.bandwidth() / 2 + shift)
        .attr("cy", value)
        .attr("transform", `translate(${attr_area.marginX}, ${attr_area.marginY})`)
        .style("fill", color);
}

// Функция рисует столбцы гистограммы
function createGist(svg, data, scaleX, scaleY, attr_area, color, value, shift = 0) {
    svg.selectAll(null)
        .data(data)
        .enter()
        .append("line")
        .attr("x1", d => scaleX(d.labelX) + scaleX.bandwidth() / 2 + shift)
        .attr("y1", d => value(d))
        .attr("x2", d => scaleX(d.labelX) + scaleX.bandwidth() / 2 + shift)
        .attr("y2", scaleY.range()[0])
        .attr("transform", `translate(${attr_area.marginX}, ${attr_area.marginY})`)
        .attr("stroke", color)
        .attr("stroke-width", 10);
}

function createChartLine(svg, arrGraph, scX, scY, attr_area, color) {
    let maxUsers = d3.select("#maxUsers").node().checked;
    let minUsers = d3.select("#minUsers").node().checked;

    if (maxUsers && minUsers) {
        createLine(svg, arrGraph, scX, attr_area, "red", d => scY(d.values[1]), 2);
        createLine(svg, arrGraph, scX, attr_area, "blue", d => scY(d.values[0]), -2);
    } else if (maxUsers) {
        createLine(svg, arrGraph, scX, attr_area, "red", d => scY(d.values[1]));
    } else if (minUsers) {
        createLine(svg, arrGraph, scX, attr_area, "blue", d => scY(d.values[0]));
    }
}

// Функция для рисования линии
function createLine(svg, data, scaleX, attr_area, color, value, shift = 0) {
    const lineGenerator = d3.line()
        .x(d => scaleX(d.labelX) + scaleX.bandwidth() / 2)
        .y(value)

    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 2)
        .attr("d", lineGenerator)
        .attr("transform", `translate(${attr_area.marginX}, ${attr_area.marginY})`);

    // Добавляем точки на линии
    svg.selectAll(".line-dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("r", 4)
        .attr("cx", d => scaleX(d.labelX) + scaleX.bandwidth() / 2 + shift)
        .attr("cy", value)
        .attr("transform", `translate(${attr_area.marginX}, ${attr_area.marginY})`)
        .style("fill", color);
}
