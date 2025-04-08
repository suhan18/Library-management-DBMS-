//DBMS_PROJECT\DBMS_PROJECT\DBMS_PROJECT\user.js

// Add event listener for book search form
document.getElementById('searchBookForm').addEventListener('submit', searchAndBorrowBook);

// Function to search, borrow, or reserve a book
async function searchAndBorrowBook(event) {
  event.preventDefault();

  const title = document.getElementById('searchTitle').value;
  const author = document.getElementById('searchAuthor').value;
  const memberId = document.getElementById('memberId').value;

  try {
    // Fetch books with matching title and author
    const response = await fetch('http://localhost:3000/books');
    if (!response.ok) throw new Error('Failed to fetch books');
    
    const books = await response.json();
    const filteredBooks = books.filter(book =>
      book.Title === title &&
      book.Author === author
    );

    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = ''; // Clear previous results

    if (filteredBooks.length > 0) {
      const book = filteredBooks[0]; // Take the first matching book

      if (book.Status === "Available") {
        // Attempt to borrow the book
        const borrowResponse = await fetch('http://localhost:3000/borrow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            member_id: memberId,
            book_id: book.Book_ID,
          })
        });

        const borrowData = await borrowResponse.json();

        if (borrowResponse.ok) {
          searchResults.innerHTML = `<p>Book borrowed successfully! Due date: ${borrowData.date_due}</p>`;
        } else {
          throw new Error(borrowData.message || 'Failed to borrow book.');
        }

      } else if (book.Status === "CheckedOut") {
        // Book is checked out, show reservation option
        searchResults.innerHTML = `<p>Book found: ${book.Title} by ${book.Author}. Status: ${book.Status}</p>`;
        document.getElementById('reservation-section').style.display = 'block';
        const reservationDetails = document.getElementById('reservationDetails');

        // Display "Reserve Book" button
        reservationDetails.innerHTML = `<button id="reserveButton">Reserve Book</button>`;

        // Add event listener for reserve button
        document.getElementById('reserveButton').addEventListener('click', async () => {
          await reserveBook(memberId, book.Book_ID); // Call the reservation function
          reservationDetails.innerHTML = `<p>Reservation confirmed for ${book.Title}. You will be notified when it’s available.</p>`;
        });

      } else {
        searchResults.innerHTML = `<p>The book is currently unavailable.</p>`;
        document.getElementById('reservation-section').style.display = 'none';
      }
    } else {
      searchResults.innerHTML = '<p>No book found with that title and author.</p>';
    }
  } catch (error) {
    console.error('Error borrowing or reserving book:', error);
    searchResults.innerHTML = `<p>Error: ${error.message}</p>`;
  }
}

// Function to reserve a book
async function reserveBook(memberId, bookId) {
  try {
    const reserveResponse = await fetch('http://localhost:3000/reserve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: memberId, book_id: bookId })
    });

    const reserveData = await reserveResponse.json();

    if (!reserveResponse.ok) {
      throw new Error(reserveData.message || 'Failed to reserve book.');
    }

    console.log(`Reservation confirmed for Book ID ${bookId} by Member ID ${memberId}`);
  } catch (error) {
    console.error('Error reserving book:', error);
    alert(`Reservation failed: ${error.message}`);
  }
}
document.getElementById('return-form').addEventListener('submit', async function (event) {
  event.preventDefault();

  const bookId = document.getElementById('bookId').value;
  const returnDate = document.getElementById('returnDate').value;
  const messageDiv = document.getElementById('message');

  // Validate input
  if (!bookId || !returnDate) {
    messageDiv.innerHTML = 'Please fill in both fields.';
    return;
  }
  try {
    const response = await fetch('http://localhost:3000/return-book', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ bookId, returnDate })
    });

    const data = await response.json();
    if (response.ok) {
      messageDiv.innerHTML = data.message;
      document.getElementById('bookId').value = '';
      document.getElementById('returnDate').value = '';
    } else {
      throw new Error(data.error || 'Failed to return book');
    }
  } catch (error) {
    console.error('Error returning book:', error);
    messageDiv.innerHTML = `Error: ${error.message}`;
  }
});
// Add event listener for reservation check form
document.getElementById('checkReservationForm').addEventListener('submit', checkMemberReservations);

// Function to check reservations by member ID
async function checkMemberReservations(event) {
  event.preventDefault();

  const memberId = document.getElementById('memberIdCheck').value;
  const reservationResults = document.getElementById('reservationResults');
  reservationResults.innerHTML = ''; // Clear previous results

  try {
    const response = await fetch(`http://localhost:3000/reservations?member_id=${memberId}`);
    if (!response.ok) throw new Error('Failed to fetch reservations');

    const reservations = await response.json();

    if (Array.isArray(reservations) && reservations.length > 0) {
      let tableHTML = `
        <h3>Reservations:</h3>
        <table>
          <thead>
            <tr>
              <th>Reservation ID</th>
              <th>Book ID</th>
              <th>Title</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
      `;

      reservations.forEach(reservation => {
        tableHTML += `
          <tr>
            <td>${reservation.Reservation_ID}</td>
            <td>${reservation.Book_ID}</td>
            <td>${reservation.Book_Title}</td>
            <td>${reservation.Book_Status}</td>
          </tr>
        `;
      });

      tableHTML += `
          </tbody>
        </table>
      `;

      reservationResults.innerHTML = tableHTML;
    } else {
      reservationResults.innerHTML = '<p>No reservations found for this Member ID.</p>';
    }
  } catch (error) {
    console.error('Error fetching reservations:', error);
    reservationResults.innerHTML = `<p>Error: ${error.message}</p>`;
  }
}
