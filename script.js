//DBMS_PROJECT\DBMS_PROJECT\DBMS_PROJECT\script.js
// Role selection handler
function selectRole(role) {
  const addBookSection = document.getElementById('add-book');
  const bookListSection = document.getElementById('book-list');
  const roleSelectionSection = document.getElementById('role-selection');

  if (role === 'admin') {
    addBookSection.style.display = 'block';  // Show add book form for admin
  } else {
    addBookSection.style.display = 'none';   // Hide add book form for user
  }

  bookListSection.style.display = 'block';    // Show the book list for both roles
  roleSelectionSection.style.display = 'none'; // Hide role selection section

  fetchBooks(); // Load books for both admin and user
}

// Add event listeners for all forms
document.getElementById('book-form').addEventListener('submit', addBook);
document.getElementById('updateBookForm').addEventListener('submit', updateBook);
document.getElementById('deleteBookForm').addEventListener('submit', deleteBook);
document.getElementById('addMemberForm').addEventListener('submit', addMember);
document.getElementById('updateMemberForm').addEventListener('submit', updateMember);
document.getElementById('deleteMemberForm').addEventListener('submit', deleteMember);

// Function to add a new book (admin only)
function addBook(e) {
  e.preventDefault();

  const bookData = {
    Title: document.getElementById('title').value,
    Author: document.getElementById('author').value,
    Status: document.getElementById('status').value,
    Publisher: document.getElementById('publisher').value,
    Edition: document.getElementById('edition').value,
    ISBN: document.getElementById('isbn').value
  };
  
  fetch('http://localhost:3000/books', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bookData)
  })
  .then(response => response.text())
  .then(data => {
    alert(data);
    fetchBooks(); // Refresh the book list
  })
  .catch(error => console.error('Error:', error));
}

// Function to update a book
async function updateBook(event) {
  event.preventDefault();

  const isbn = document.getElementById('updateISBN').value;
  const updatedData = {
    Title: document.getElementById('updateTitle').value,
    Author: document.getElementById('updateAuthor').value,
    Status: document.getElementById('updateStatus').value,
    Publisher: document.getElementById('updatePublisher').value,
    Edition: document.getElementById('updateEdition').value
  };

  try {
    const response = await fetch(`http://localhost:3000/books/${encodeURIComponent(isbn)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    });
    
    const data = await response.text();
    if (response.ok) {
      alert('Book updated successfully');
    } else {
      alert(`Failed to update book: ${data}`);
    }

    fetchBooks(); // Refresh the book list
  } catch (error) {
    console.error('Error updating book:', error);
  }
}

// Function to delete a book
async function deleteBook(event) {
  event.preventDefault();
  const isbn = document.getElementById('deleteISBN').value;

  try {
    const response = await fetch(`http://localhost:3000/books/${encodeURIComponent(isbn)}`, {
      method: 'DELETE'
    });
    const data = await response.text();
    alert(data);
    fetchBooks(); // Refresh the book list
  } catch (error) {
    console.error('Error:', error);
  }
}

// Function to add a new member
async function addMember(event) {
  event.preventDefault();

  const memberData = {
    Name: document.getElementById('memberName').value,
    Email: document.getElementById('memberEmail').value
  };

  try {
    const response = await fetch('http://localhost:3000/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memberData)
    });

    const data = await response.text();
    document.getElementById('memberMessage').innerText = data; // Display the response message

    document.getElementById('addMemberForm').reset(); // Reset form fields if needed
  } catch (error) {
    console.error('Error:', error);
  }
}

// Function to update a member
async function updateMember(event) {
  event.preventDefault();
  const id = document.getElementById('memberupdateId').value;
  const updatedData = {
    Name: document.getElementById('memberupdateName').value,
    Email: document.getElementById('memberupdateEmail').value
  };

  try {
    const response = await fetch(`http://localhost:3000/members/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    });
    const data = await response.text();
    alert(data);
  } catch (error) {
    console.error('Error updating member:', error);
  }
}

// Function to delete a member
async function deleteMember(event) {
  event.preventDefault();
  const id = document.getElementById('deleteMemberId').value;

  try {
    const response = await fetch(`http://localhost:3000/members/${id}`, {
      method: 'DELETE'
    });
    const data = await response.text();
    alert(data);
  } catch (error) {
    console.error('Error deleting member:', error);
  }
}

// Function to fetch and display books
function fetchBooks() {
  fetch('http://localhost:3000/books')
    .then(response => response.json())
    .then(data => {
      const booksList = document.getElementById('books');
      booksList.innerHTML = '';
      data.forEach(book => {
        const li = document.createElement('li');
        li.textContent = `${book.Title} by ${book.Author} - ${book.Status}`;
        booksList.appendChild(li);
      });
    })
    .catch(error => console.error('Error fetching books:', error));
}

// Load books on page load
fetchBooks();
