document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';


  document.querySelector('form').onsubmit = function() {
    to = document.querySelector('#compose-recipients');
    subject = document.querySelector('#compose-subject');
    body = document.querySelector('#compose-body');
    

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: to.value,
        subject: subject.value,
        body: body.value
    })
  })
.then(response => response.json())
.then(result => {
    // Print result
    console.log(result);
    console.log(result.error);
    if(result.error === undefined) {
      load_mailbox("sent")
    }
    else{
      alert(result.error)
    }

});
 return false;
  }
  

}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide compose form
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;  

  fetch(`/emails/${mailbox}`)
      .then((response) => response.json())
      .then((emails) => {
        emails.forEach((element) => {
          if (mailbox != "sent") {
            sender_recipients = element.sender;
          } else {
            sender_recipients = element.recipients;
          }
          if (mailbox == "inbox") {
            if (element.read) is_read = "read";
            else is_read = "";
          } else is_read = "";
          var item = document.createElement("div");
          item.className = `border border-primary ${is_read}`;
  
          item.innerHTML = `<div id="item-${element.id}">
          
          ${element.subject} | ${sender_recipients} | ${element.timestamp}
          <br>
          ${element.body}
        </div>`;
          document.querySelector("#emails-view").appendChild(item);
          item.addEventListener("click", () => {
            show_mail(element.id, mailbox);
          });
        });
      });
}

function show_mail(id, mailbox) {
  fetch(`/emails/${id}`)
    .then((response) => response.json())
    .then((email) => {
      // Print email
      console.log(email);
      document.querySelector("#emails-view").innerHTML = "";
      var item = document.createElement("div");
      item.className = `border border-primary`;
      item.innerHTML = `<div>
  Sender: ${email.sender}
  Recipients: ${email.recipients}
  Subject: ${email.subject}
  Time: ${email.timestamp}
  <br>${email.body}
      </div>`;
      document.querySelector("#emails-view").appendChild(item);
      if (mailbox == "sent") return;
      let archive = document.createElement("btn");
      archive.className = `btn btn-sm btn-outline-primary`;
      archive.addEventListener("click", () => {
        archive_unarchive(id, email.archived);
        if (archive.innerText == "Archive") archive.innerText = "Unarchive";
        else archive.innerText = "Archive";
      });
      if (!email.archived) archive.textContent = "Archive";
      else archive.textContent = "Unarchive";
      document.querySelector("#emails-view").appendChild(archive);

      let reply = document.createElement("btn");
      reply.className = `btn btn-sm btn-outline-primary`;
      reply.textContent = "Reply";
      reply.addEventListener("click", () => {
        reply_mail(email.sender, email.subject, email.body, email.timestamp);
      });
      document.querySelector("#emails-view").appendChild(reply);
      mark_read(id);
    });
}

function archive_unarchive(id, state) {
  fetch(`/emails/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      archived: !state,
    }),
  })
  .then(
   load_mailbox("inbox")
    );
}

function mark_read(id) {
  fetch(`/emails/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      read: true,
    }),
  });
}

function reply_mail(sender, subject, body, timestamp) {
  compose_email();
  var recolon = new RegExp("Re:");
  var recolonthere = recolon.test(subject)
  if (!recolonthere) subject = `Re: ${subject}`;
  document.querySelector("#compose-recipients").value = sender;
  document.querySelector("#compose-subject").value = subject;

  pre_fill = `\n\n\nOn ${timestamp} ${sender} wrote:\n${body}\n`;

  document.querySelector("#compose-body").value = pre_fill;
}