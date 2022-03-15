var tasks = {};

var createTask = function(taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
  var taskP = $("<p>")
    .addClass("m-1")
    .text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  //check due date
  auditTask(taskLi);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

var loadTasks = function() {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  }

  // loop over object properties
  $.each(tasks, function(list, arr) {
    // then loop over sub-array
    arr.forEach(function(task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

//task item text becomes editable when clicked
$('.list-group').on('click', 'p', function() {
  const text = $(this)
    .text()
    .trim();
  const textInput = $('<textarea>')
    .addClass('form-control')
    .val(text);
  $(this).replaceWith(textInput);
  textInput.trigger('focus');
})

const auditTask = function(taskEl) {
  //retrieve date chosen
  const date = $(taskEl)
    .find('span')
    .text()
    .trim();

  //convert to moment object
  const time = moment(date, 'L').set('hour', 17);

  //remove old classes
  $(taskEl).removeClass('list-group-item-warning list-group-item-danger');

  //check if date has passed
  if (moment().isAfter(time)) {
    $(taskEl).addClass('list-group-item-danger');
  } else if (Math.abs(moment().diff(time, 'days')) <= 2) {
    $(taskEl).addClass('list-group-item-warning');
  }
}

//when edited text is clicked out of, text is saved to task item
$('.list-group').on('blur', 'textarea', function() {
  console.log(this)
  const text =  $(this)
    .val()
    .trim();

  //parent ul's id attribute
  const status = $(this)
    .closest('.list-group')
    .attr('id')
    .replace('list-', '');

  console.log(status)

  //task position in relation to other li elements
  const index = $(this)
    .closest('.list-group-item')
    .index();

  //update task to our array of objects
  tasks[status][index].text = text;
  saveTasks();

  //update task text
  const taskP = $('<p>')
    .addClass('m-1')
    .text(text)
  
  $(this).replaceWith(taskP);
})

//due date clicked
$('.list-group').on('click', 'span', function() {
  //current text
  const date = $(this)
    .text()
    .trim();
  
  //create new input element on date
  const dateInput = $('<input>')
    .attr('type', 'text')
    .addClass('form-control')
    .val(date);
  
  //swap to input field
  $(this).replaceWith(dateInput);

  dateInput.datepicker({
    minDate: 1,
    onClose: function() {
      $(this).trigger('change');
    }
  });

  //focus on input field
  dateInput.trigger('focus');
})

$('.list-group').on('change', 'input[type="text"]', function() {
  //user text
  const date = $(this)
    .val()
    .trim();

  //get parent element id
  const status = $(this)
    .closest('.list-group')
    .attr('id')
    .replace('list-', '');
  

  //get task position
  const index = $(this)
    .closest('.list-group-item')
    .index();

  //update task in our array of objects
  tasks[status][index].date = date;
  saveTasks();

  //turn back into span from input
  const taskSpan = $('<span>')
    .addClass('badge badge-primary bade-pill')
    .text(date);
  $(this).replaceWith(taskSpan);

  auditTask($(taskSpan).closest('.list-group-item'))
})

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function() {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function() {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-save").click(function() {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });

    saveTasks();
  }
});

// remove all tasks
$("#remove-tasks").on("click", function() {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

$(".card .list-group").sortable({
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  activate: function(event) {
    $(this).addClass("dropover");
    $('.bottom-trash').addClass('bottom-trash-drag');
  },
  deactivate: function(event) {
    $(this).removeClass('dropover');
    $('.bottom-trash').removeClass('bottom-trash-drag');
  },
  over: function(event) {
    $(event.target).addClass('dropover-active');
  },
  out: function(event) {
    $(event.target).removeClass('dropover-active');
  },
  update: function(event) {
    let tempArr = [];

    $(this).children().each(function() {
      let text = $(this)
        .find('p')
        .text()
        .trim();

      let date = $(this)
        .find('span')
        .text()
        .trim();

      tempArr.push({
        text: text,
        date: date,
      });
    });

    const arrName = $(this)
      .attr('id')
      .replace('list-', '');

    tasks[arrName] = tempArr;
    saveTasks();
  }
});

$('#trash').droppable({
  accept: '.card .list-group-item',
  tolerance: 'touch',
  drop: function(event, ui) {
    ui.draggable.remove();
    $('.bottom-trash').removeClass('bottom-trash-active');
  },
  over: function(event, ui) {
    $('.bottom-trash').addClass('bottom-trash-active');
  },
  out: function(event, ui) {
    $('.bottom-trash').removeClass('bottom-trash-active');
  }
})

$('#modalDueDate').datepicker({
  minDate: 1
});

//audit the tasks every 30 minutes
setInterval(function() {
  $('.card .list-group-item').each(function(index, el) {
    auditTask(el)
  })
}, ((1000 * 60) * 30))

// load tasks for the first time
loadTasks();


