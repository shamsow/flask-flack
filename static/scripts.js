// Allows user to temprarily hide their own messages
const hide_message = e => {
  item = e.parentNode;
  list = document.querySelector('#messages');
  hide_item = document.getElementById(item.id)
  if (myStorage.getItem('savedUser') == e.dataset.user) {
    list.removeChild(hide_item);
  }
  else {
    alert('You can only hide your own messages!')
  }
};

const add_message = (id, time, user, message) => {
  let messageArea = $("#messages");
  let current_user = myStorage.getItem('savedUser');
  // messageArea.append(`
        
  //   <li id="${id}" class="list-group-item list-group-item-dark d-flex justify-content-between align-items-center">
  //   <div class="input-group-prepend">
  //         <div class="input-group-text">@</div>
  //       </div>
  //   ${user} : ${message}
  //   <span class="badge badge-dark badge-pill">${time}</span>
  //   </li>
    
  // `);

  messageArea.append(`
  <div href="#" id="${id}" class="list-group-item list-group-item-dark">
    <div class="d-flex w-100 justify-content-between">
      <p class="mb-1 text-secondary">${user}</p>
      <span class="badge badge-secondary">${time}</span>
    </div>
    <br>
    <h3 class="mb-1 pl-2">${message}</h3>
  </div>
  `);
  // if (user == current_user) {
  //   messageArea.append(`
  //   <li id="${id}" class="list-group-item list-group-item-dark active"><small>${time}</small> | <strong>${user}</strong> : ${message}</li>
  // `)
  // }
  // else {
  //   messageArea.append(`
  //   <li id="${id}" class="list-group-item list-group-item-dark"><small>${time}</small> | <strong>${user}</strong> : ${message}</li>
  // `)
  // };
};

document.addEventListener('DOMContentLoaded', () => {
  // Connecting the web socket
  var socket = io.connect('http://' + document.domain + ':' + location.port);
  // Setting up local storage in browser
  myStorage = window.localStorage;

  // Used for testing purposes
  // myStorage.clear();

  window.onload = function(){
    // Fill in form with previously entered name if username is in local storage
    if(myStorage.getItem('savedUser')) {
      prev_name = myStorage.getItem('savedUser');
      console.log(prev_name);
      document.getElementById("username_submit").value = `${prev_name}`;
    }

    // Automaticall select previously selected channel if saved in local storage
    if(myStorage.getItem('savedChannel')) {
      let channelArea = document.querySelector("#channel_list");
      if (channelArea.hasChildNodes()) {
        prev_channel = myStorage.getItem('savedChannel')
        document.querySelector("#channel_name").innerHTML = `${prev_channel}`;
      }
      
    }
    else {
      // Else disable message field because channel has to be selected first
       document.getElementById("message_submit").disabled = true;
     }

    // Add new username when entered
    document.querySelector('#username_button').onclick = () => {
      username = document.querySelector('#username_submit').value
      // Don't let usename entry be blank
      if(username !== '') {
        myStorage.setItem('savedUser', username)
        socket.emit("username_enter", username)
        socket.emit("get_users");
        // Remove overlay when username has been submitted
        document.getElementById("username_overlay").style.display = "none";
        return false
      }
    }

    // Get all existing channels and fill list of channels
    socket.emit("get_channels");
    socket.on('channels_all', channels => {
      var list = document.querySelector('#channels');
      var channel_data = channels;
      for (var i = 0; i < channel_data.length; i++) {
            var opt = channel_data[i];
            var el = document.createElement('option');
            el.textContent = opt;
            el.value = opt;
            list.appendChild(el);

          }
      // Auto select previously selected channel
      for (var x = 0; x < channel_data.length; x++) {
        var opt = channel_data[x];
        if(opt == myStorage.getItem('savedChannel')) {
          list.options[x].selected = true;
          socket.emit('get_messages', myStorage.getItem('savedChannel'))
          return;
        }
      }
      });
    // Get all users and list them
    socket.on('users_all', users => {
      // var list = document.querySelector('#users');
      let list = $("#users");
      current_user = myStorage.getItem("savedUser");
      let user_data = users;
      for (var i = 0; i < user_data.length; i++) {
            if (user_data[i] == current_user) {
              list.append(`<li class="list-group-item active">${user_data[i]}</li>`);
            }
            else {
              list.append(`<li class="list-group-item">${user_data[i]}</li>`);
            }
            // var opt = user_data[i];
            // var el = document.createElement('option');
            // el.textContent = opt;
            // el.value = opt;
            // list.appendChild(el);
            }
    });
    // Get input of user's channel entry
    document.querySelector('#channel_create').onsubmit = () => {
        channel = document.querySelector('#create_channel').value;
        // Don't let channel entry be blank
        if(channel !== '') {
          socket.emit("channel_creation", channel);
          document.querySelector('#create_channel').value = '';
          return false;
        }
        else {
          problem = "Type what you want your channel to be named!";
          socket.emit('error', problem);
          return false;
        }
    };
    // Add new channel to list of options
    socket.on('channel_added', channel => {
      var list = document.querySelector('#channels');
      var channel_data = channel
      var opt = channel_data;
      var el = document.createElement('option');
      el.textContent = opt;
      el.value = opt;
      list.appendChild(el);
      });
    // Get channel pick if user changes selection
    var choice = document.getElementById('channels');
    choice.addEventListener("change", () => {
      channel = document.querySelector('#channels').value;
      document.querySelector("#channel_name").innerHTML = `<em>${channel}</em>`;
      myStorage.setItem('savedChannel', channel);
      document.getElementById("message_submit").disabled = false;
      var list = document.getElementById("messages");
      // clear messages area when channel changed
      while (list.hasChildNodes()) {
        list.removeChild(list.firstChild);
      }
      socket.emit('get_messages', channel);
      });
    // Get input of new message
    document.querySelector('#new_message').onsubmit = () => {
        // Send the message, user, channel and time to server
        msg = document.querySelector("#message_submit").value;
        if (msg !== '') {
        user = myStorage.getItem('savedUser');
        const channel = myStorage.getItem('savedChannel');
        socket.emit('new_message',{'msg': msg, 'user': user, 'channel': channel});
        document.querySelector("#message_submit").value = '';
        return false;
        } else {
          problem = "Type something to send a message!";
          socket.emit('error', problem);
          return false;
        }
    };
    // Add new message with a numbered id
    socket.on('announce message', content => {
      check = document.getElementById('messages').hasChildNodes();
      if (!check) {
        add_message(0, content.my_time, content.user, content.msg);
        // const li = document.createElement('li');
        // li.id = 0;
        
        // li.classList = "list-group-item list-group-item-dark";
        // li.innerHTML = `<small>${content.my_time}</small> | <strong>${content.user}</strong> : ${content.msg} <button class="hide_button" onclick='hide_message(this)' data-user=${content.user}>X</button>`;
        // document.querySelector('#messages').append(li);
      }
      else {
        
        const li = document.createElement('li');
        ul = document.getElementById('messages')
        x = parseInt(ul.lastElementChild.id)
        // li.id = x + 1;
        add_message(x + 1, content.my_time, content.user, content.msg)
        // li.classList = "list-group-item list-group-item-dark";
        // li.innerHTML = `<small>${content.my_time}</small> | <strong>${content.user}</strong> : ${content.msg} <button class="hide_button" onclick='hide_message(this)' data-user=${content.user}>X</button>`;
        // document.querySelector('#messages').append(li);
      }
    });

    // Get all existing messages for channel and list them
    socket.on('broadcast messages', content => {
        channel = myStorage.getItem('savedChannel')
        for(var i = 0; i < content[channel].length; i++){
            
            add_message(i, content[channel][i].my_time, content[channel][i].user, content[channel][i].msg)
            // const li = document.createElement('li');
            // li.id = i;
            // li.classList = "list-group-item list-group-item-dark";
            // li.innerHTML = `<small>${content[channel][i].my_time}</small> | <strong>${content[channel][i].user}</strong> : ${content[channel][i].msg} <button class="hide_button" onclick='hide_message(this)' data-user=${content[channel][i].user}>X</button>`;
            // document.querySelector("#messages").append(li);
        }
    });

    // Error alert
    socket.on('error', problem => {
      alert(problem);
    });
    };
});
// const add_message = (id, time, user, message) => {
//   let messageArea = $("#messages");
//   messageArea.append(`
//     <li id="${id}" class="list-group-item list-group-item-dark"><small>${time}</small> | <strong>${user}</strong> : ${message}</li>
//   `)
// };
