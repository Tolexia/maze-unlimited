var canvas = document.getElementById('canvas')

const win_width = window.innerWidth
const win_height = window.innerHeight

canvas.width  = win_width
canvas.height = win_height

const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = true;

const edge_dist = win_width > 500 ? 30 : 10
const edge_thickness = win_width > 500 ? 20 : 5
const edge_min = edge_dist + edge_thickness
const largeness_ref = Math.min( win_width ,  win_height )
const edge_largeness = largeness_ref - (edge_dist * 2)
const margin_x = win_width - edge_largeness
const margin_y = win_height - edge_largeness
const margin = Math.min(margin_x, margin_y)

const cells = localStorage.getItem("cells") ? JSON.parse(localStorage.getItem("cells")) : []
const cell_edges = ["top", "left", "bottom", "right"]
const default_cell_size = 30

let cell_size,
total_inside_largeness,
divide,
cell_count,
total_padding,
cell_edge_tickness

setCellsSizes(default_cell_size)

function setCellsSizes(set_cell_size)
{
    cell_size = set_cell_size
    total_inside_largeness = edge_largeness - (edge_thickness * 2) - (margin)
    divide = (total_inside_largeness / cell_size);
    cell_count = Math.round(divide)
    total_padding = total_inside_largeness - (cell_count * cell_size)
    cell_edge_tickness = total_padding / cell_count

    if(total_padding <= 5)
        setCellsSizes(cell_size-1)
}
console.log("total_inside_largeness", total_inside_largeness)
console.log("divide", divide)
console.log("cell_count", cell_count)
console.log("total_padding", total_padding)
console.log("cell_edge_tickness", cell_edge_tickness)


let current_x = localStorage.getItem("current_x") ? parseInt(localStorage.getItem("current_x")) : 0
let current_y = localStorage.getItem("current_y") ? parseInt(localStorage.getItem("current_y")) : 0
let current = cells.find(val => val.is_current === true)

const forbidden_edges = [
    {
        x : 0,
        y : 0,
        edges : ["right", "bottom"]
    },
    {
        x : 1,
        y : 0,
        edges : ["left"]
    },
    {
        x : 0,
        y : 1,
        edges : ["top"]
    }
]

function placeExit() {
    let exitPlaced = false;
    while (!exitPlaced) {
        const x = Math.floor(Math.random() * cell_count);
        const y = Math.floor(Math.random() * cell_count);
        const cell = cells.find(c => c.x === x && c.y === y);
        
        if (!cell.is_current) {
            cell.is_exit = true;
            exitPlaced = isExitReachable();
            if (!exitPlaced) {
                cell.is_exit = false;
            }
        }
    }
}

function isExitReachable() {
    const visited = new Set();
    const stack = [cells.find(c => c.is_current)];

    while (stack.length > 0) {
        const current = stack.pop();
        if (current.is_exit) return true;

        const key = `${current.x},${current.y}`;
        if (!visited.has(key)) {
            visited.add(key);
            const neighbors = getAccessibleNeighbors(current);
            stack.push(...neighbors);
        }
    }

    return false;
}

function getAccessibleNeighbors(cell) {
    const neighbors = [];
    const directions = ["top", "right", "bottom", "left"];

    for (let direction of directions) {
        if (!cell.edges.includes(direction)) {
            let nextX = cell.x, nextY = cell.y;
            switch (direction) {
                case "top": nextY--; break;
                case "right": nextX++; break;
                case "bottom": nextY++; break;
                case "left": nextX--; break;
            }
            const neighbor = cells.find(c => c.x === nextX && c.y === nextY);
            if (neighbor) neighbors.push(neighbor);
        }
    }

    return neighbors;
}

function genMaze() {
    for (let x = 0; x < cell_count; x++) {
        for (let y = 0; y < cell_count; y++) {
            cells.push({
                x, y,
                edges: ["top", "right", "bottom", "left"],
                visited: false,
                is_exit: false,
                is_current: (x === 0 && y === 0),
                has_past_by: false
            });
        }
    }

    recursiveBacktrack(0, 0);

    placeExit();

    localStorage.setItem("cells", JSON.stringify(cells));
}

function recursiveBacktrack(x, y) {
    const current = cells.find(cell => cell.x === x && cell.y === y);
    current.visited = true;

    const directions = shuffle(["top", "right", "bottom", "left"]);

    for (let direction of directions) {
        let nextX = x, nextY = y;
        switch (direction) {
            case "top": nextY--; break;
            case "right": nextX++; break;
            case "bottom": nextY++; break;
            case "left": nextX--; break;
        }

        if (nextX >= 0 && nextX < cell_count && nextY >= 0 && nextY < cell_count) {
            const next = cells.find(cell => cell.x === nextX && cell.y === nextY);
            if (!next.visited) {
                current.edges = current.edges.filter(edge => edge !== direction);
                next.edges = next.edges.filter(edge => edge !== getOppositeDirection(direction));
                recursiveBacktrack(nextX, nextY);
            }
        }
    }
}

function getOppositeDirection(direction) {
    switch (direction) {
        case "top": return "bottom";
        case "bottom": return "top";
        case "left": return "right";
        case "right": return "left";
        case "up": return "down";
        case "down": return "up";
    }
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function drawEdge()
{
    ctx.fillStyle = "black"
    ctx.fillRect(edge_dist + (margin_x / 2), edge_dist + (margin_y / 2), edge_largeness - (edge_dist* 2), edge_largeness-(edge_dist* 2));
    
    ctx.fillStyle = "white"
   
    ctx.fillRect(edge_min + (margin_x / 2), edge_min + (margin_y / 2), edge_largeness - (edge_min*2), edge_largeness-(edge_min*2));
}

function drawMaze()
{
    const initial_x = edge_min + (margin_x / 2)
    const initial_y = edge_min + (margin_y / 2)
    ctx.clearRect(initial_x, initial_y, total_inside_largeness, total_inside_largeness)

    for(let x = 0; x < cell_count ; x++)
    {
        for(let y = 0; y < cell_count ; y++)
        {
            const cell = cells.find(val => val.x == x && val.y == y)

            let x_pos = initial_x + (x * cell_size) 
            let y_pos = initial_y + (y * cell_size)

            if(total_padding > 0)
            {
                x_pos += (total_padding / 2)
                y_pos += (total_padding / 2)
            }
            
            // Draw cell with edges
            for(let edge_pos = 0; edge_pos < cell_edges.length ; edge_pos++)
            {
                const current_edge = cell_edges[edge_pos]

                if(!cell.edges.includes(current_edge))
                    continue;

                let x_edge_min, edge_width, y_edge_min, edge_height

                ctx.fillStyle = "black"

                switch(current_edge)
                {
                    case "top":
                        x_edge_min = x_pos
                        y_edge_min = y_pos
                        edge_width = cell_size
                        edge_height = cell_edge_tickness
                        break;
                    case "right":
                        x_edge_min = x_pos + cell_size - cell_edge_tickness
                        y_edge_min = y_pos
                        edge_width = cell_edge_tickness
                        edge_height = cell_size
                        break;
                    case "bottom":
                        x_edge_min = x_pos
                        y_edge_min = y_pos + cell_size - cell_edge_tickness
                        edge_width = cell_size
                        edge_height = cell_edge_tickness
                        break;
                    case "left":
                        x_edge_min = x_pos
                        y_edge_min = y_pos
                        edge_width = cell_edge_tickness
                        edge_height = cell_size
                        break;
                    default:
                        break;
                }

                ctx.fillRect(x_edge_min + cell_edge_tickness, y_edge_min + cell_edge_tickness, (edge_width - (cell_edge_tickness * 2)),( edge_height - (cell_edge_tickness * 2)));   
            }

            // Draw inner cell
             if(cell.is_exit)
                ctx.fillStyle = "red"
            else if(cell.has_past_by)
                ctx.fillStyle = "#d1cfcf24"
            else
                ctx.fillStyle = "transparent"

            if(cell.has_past_by)
                ctx.fillRect(x_pos, y_pos, cell_size, cell_size);
            else
                ctx.fillRect(x_pos + cell_edge_tickness, y_pos + cell_edge_tickness, cell_size - (cell_edge_tickness * 2), cell_size - (cell_edge_tickness * 2));

        }
    }
}

function init()
{
    drawEdge()

    if(cells.length == 0)
        genMaze()

    current = cells.find(val => val.is_current === true)
    drawMaze()
    drawPlayer(current_x, current_y);
}


function move(direction) {
    if (animating) return;

    let newX = current_x;
    let newY = current_y;

    switch (direction) {
        case 'up': newY--; break;
        case 'down': newY++; break;
        case 'left': newX--; break;
        case 'right': newX++; break;
    }

    const current = cells.find(val => val.x == current_x && val.y == current_y);
    const dest = cells.find(val => val.x == newX && val.y == newY);

    if (dest && canMove(current, dest, direction)) {
        startX = current_x;
        startY = current_y;
        targetX = newX;
        targetY = newY;
        animating = true;
        animationStartTime = performance.now();
        requestAnimationFrame(animateMove);
    }
}

function canMove(from, to, direction) {
    switch (direction) {
        case 'up': return !from.edges.includes('top') && !to.edges.includes('bottom');
        case 'down': return !from.edges.includes('bottom') && !to.edges.includes('top');
        case 'left': return !from.edges.includes('left') && !to.edges.includes('right');
        case 'right': return !from.edges.includes('right') && !to.edges.includes('left');
    }
}

function drawPlayer(x, y) {
    const initial_x = edge_min + (margin_x / 2);
    const initial_y = edge_min + (margin_y / 2);
    
    const playerX = initial_x + (x * cell_size) + (total_padding / 2) + cell_edge_tickness;
    const playerY = initial_y + (y * cell_size) + (total_padding / 2) + cell_edge_tickness;
    const playerSize = cell_size - (cell_edge_tickness * 2);

    ctx.fillStyle = "black";
    ctx.fillRect(playerX, playerY, playerSize, playerSize);
}

function animateMove(timestamp) {
    if (!animationStartTime) animationStartTime = timestamp;
    const elapsed = timestamp - animationStartTime;
    const progress = Math.min(elapsed / animationDuration, 1);

    const currentX = startX + (targetX - startX) * progress;
    const currentY = startY + (targetY - startY) * progress;

    drawMaze();
    drawPlayer(currentX, currentY);

    if (progress < 1) {
        requestAnimationFrame(animateMove);
    } else {
        animating = false;
        current_x = targetX;
        current_y = targetY;
        localStorage.setItem("current_x", current_x);
        localStorage.setItem("current_y", current_y);
        updateCurrent();
    }
}


function up() { move('up'); }
function down() { move('down'); }
function left() { move('left'); }
function right() { move('right'); }


let animating = false;
let animationStartTime;
let animationDuration = 200; // durée de l'animation en millisecondes
let startX, startY, targetX, targetY;

document.body.addEventListener('keydown', e => {

    if(e.key == "ArrowUp") {
        up()
    }
    if(e.key == "ArrowLeft") {
        left()
    }
    if(e.key == "ArrowRight") {
        right()
    }
    if(e.key == "ArrowDown") {
        down()
    }
})

function updateCurrent() {
    current.is_current = false;
    current.has_past_by = true;

    const new_current = cells.find(val => val.x == current_x && val.y == current_y);
    if (new_current) {
        if (new_current.is_exit) return has_won();

        new_current.is_current = true;
        current = new_current;
    }

    localStorage.setItem("cells", JSON.stringify(cells));
    drawMaze();
    drawPlayer(current_x, current_y);
}

function reset()
{
    localStorage.clear()
    window.location.reload()
}

function has_won()
{
    alert("You Win !")
    reset()
}

if (screen && screen.orientation) {
    window.screen.orientation.onchange = () => reset();
}

document.body.addEventListener('touchstart', e => {
    window.touch_X_start = e.targetTouches[0].clientX
    window.touch_Y_start = e.targetTouches[0].clientY
})

window.isTouching = false
document.body.addEventListener('touchmove', e => {
    window.touch_X_end = e.targetTouches[0].clientX
    window.touch_Y_end = e.targetTouches[0].clientY
})
document.body.addEventListener('touchend', e => {
    handleTouchEnd()
})

function handleTouchEnd()
{
    const diffX = (window.touch_X_end - window.touch_X_start)
    const diffY = (window.touch_Y_end - window.touch_Y_start)


    if(Math.abs(diffY) > Math.abs(diffX)) // Vertical
    {
        if(diffY > 100)
            down()
        else if(diffY < -100)
            up()
    }
    else // Horizontal
    {
        if(diffX > 100)
            right()
        else if(diffX < -100)
            left()
    }

    let toRightCondition = (diffX > 100 )
    let toLeftCondition = (diffX < -100 )
}

init()
/*function draw() 
{

    requestAnimationFrame(draw)
}*/