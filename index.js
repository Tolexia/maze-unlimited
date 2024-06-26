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

function genMaze()
{
    console.log("genMaze")
    let has_exit = false

    for(let x = 0; x < cell_count ; x++)
    {
        for(let y = 0; y < cell_count ; y++)
        {
           
            // Determine Edges

            const edges = []

            if(x == 0)
                edges.push("left")
            
            
            if(y == 0)
                edges.push("top")
            
            if(x == (cell_count - 1))
                edges.push("right")
            
            if(y == (cell_count - 1))
                edges.push("bottom")
            
            const prev_x = cells[x-1]
            const prev_y = cells[y-1]


            for(let edge_pos = 0; edge_pos < cell_edges.length ; edge_pos++)
            {
                const current_edge = cell_edges[edge_pos]

                if(edges.includes(current_edge))
                    continue;

                
                const random = Math.random()

                let add_edge_threshold = 0
                switch(edges.length)
                {
                    case 0:
                        add_edge_threshold = 0.5
                        break;
                    case 1:
                        add_edge_threshold = 0.25
                        break;
                    default:
                        break;
                }

                if(prev_x)
                {
                    if(current_edge == "left" || current_edge == "right")
                    {
                        if(prev_x.edges.includes("left") || prev_x.edges.includes("right"))
                        {
                            add_edge_threshold /= 3
                        }
                    }
                }

                let prevent_add = (forbidden_edges.find(forbidden => forbidden.x == x && forbidden.y == y && forbidden.edges.includes(current_edge)))
                    
                if(random < add_edge_threshold && !prevent_add)
                    edges.push(current_edge)
            }

            // Determine Exit
            let is_exit = false
            if(
                !has_exit && 
                x  >= (cell_count / 2) - 2 && 
                x  <= (cell_count / 2) + 2 && 
                y  >= (cell_count / 2) - 2 && 
                y  <= (cell_count / 2) + 2 &&
                Math.random() >= 0.4
            )
            {
                is_exit = has_exit = true
            }

            

            // Determine if current cell
            const is_current = (x == 0 && y == 0)

            cells.push({
                x,
                y,
                edges,
                is_exit,
                is_current,
                has_past_by: false
            })
        }
    }

    localStorage.setItem("cells", JSON.stringify(cells))
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
    ctx.clearRect(initial_x,initial_y,total_inside_largeness,total_inside_largeness)

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
            if(cell.is_current)
                ctx.fillStyle = "black"
            else if(cell.is_exit)
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
}

function up()
{
    const dest = cells.find(val => val.y == current_y-1 && val.x == current_x)
    if(current_y > 0 && !current.edges.includes("top") && !dest.edges.includes("bottom")) current_y -= 1
    localStorage.setItem("current_y", current_y)
    updateCurrent()
}
function left()
{
    const dest = cells.find(val => val.y == current_y && val.x == current_x-1)
    if(current_x > 0 && !current.edges.includes("left") && !dest.edges.includes("right")) current_x -= 1
    localStorage.setItem("current_x", current_x)
    updateCurrent()
}
function down()
{
    const dest = cells.find(val => val.y == current_y+1 && val.x == current_x)
    if(current_y < cell_count - 1 && !current.edges.includes("bottom") && !dest.edges.includes("top")) current_y += 1
    localStorage.setItem("current_y", current_y)
    updateCurrent()
}
function right()
{
    const dest = cells.find(val => val.y == current_y && val.x == current_x+1)
    if(current_x < cell_count - 1 && !current.edges.includes("right") && !dest.edges.includes("left")) current_x += 1
    localStorage.setItem("current_x", current_x)
    updateCurrent()
}
let animating = false
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

function updateCurrent()
{
    current.is_current = false
    current.has_past_by = true

    const new_current = cells.find(val => val.x == current_x && val.y == current_y)
    if(new_current)
    {
        if(new_current.is_exit)  return has_won()

        new_current.is_current = true
        current = new_current
    } 
    localStorage.setItem("cells", JSON.stringify(cells))
    drawMaze()
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