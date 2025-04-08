//DBMS_PROJECT\DBMS_PROJECT\DBMS_PROJECT\admin.js

// Show the add book form
function showAddBookForm() {
    document.getElementById('add-book').style.display = 'block';
    document.getElementById('book-list').style.display = 'none';
  }
  
  // View the list of books
  function viewBooks() {
    document.getElementById('add-book').style.display = 'none';
    document.getElementById('book-list').style.display = 'block';
    fetchBooks(); // Load books to display in the list
  }
  
  // Add a new book (for admin)
  document.getElementById('book-form').addEventListener('submit', addBook);
  
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
      document.getElementById('book-form').reset(); // Clear form fields
      fetchBooks(); // Refresh the book list after adding
    })
    .catch(error => console.error('Error:', error));
  }
  
  // Fetch and display books
  function fetchBooks() {
    fetch('http://localhost:3000/books')
      .then(response => response.json())
      .then(books => {
        const booksList = document.getElementById('books');
        booksList.innerHTML = ''; // Clear the list before updating
  
        // Loop through the books and add each to the list
        books.forEach(book => {
          const listItem = document.createElement('li');
          listItem.textContent = `Title: ${book.Title}, Author: ${book.Author}, Status: ${book.Status}, Publisher: ${book.Publisher}, Edition: ${book.Edition}, ISBN: ${book.ISBN}`;
          booksList.appendChild(listItem);
        });
      })
      .catch(error => console.error('Error fetching books:', error));
  }
  