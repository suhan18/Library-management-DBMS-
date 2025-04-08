//DBMS_PROJECT\DBMS_PROJECT\DBMS_PROJECT\library-management-backend\server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// MySQL database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Angel$777',
  database: 'LibraryManagement'
});

db.connect(err => {
  if (err) throw err;
  console.log('Connected to the database');
});

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'vaishreddy786@gmail.com',  // replace with your email
    pass: 'dibb yshy xlmz bgqb'                // replace with your email password
  }
});

// CRUD for Books
app.get('/books', (req, res) => {
  db.query('SELECT * FROM BOOK', (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.post('/books', (req, res) => {
  const { Title, Author, Status, Publisher, Edition, ISBN } = req.body;
  const sql = 'INSERT INTO BOOK (Title, Author, Status, Publisher, Edition, ISBN) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(sql, [Title, Author, Status, Publisher, Edition, ISBN], (err, result) => {
    if (err) throw err;
    res.send('Book added successfully');
  });
});

app.put('/books/:isbn', (req, res) => {
  const { isbn } = req.params;
  const { Title, Author, Status, Publisher, Edition } = req.body;
  const sql = 'UPDATE BOOK SET Title = ?, Author = ?, Status = ?, Publisher = ?, Edition = ? WHERE ISBN = ?';
  db.query(sql, [Title, Author, Status, Publisher, Edition, isbn], (err, result) => {
    if (err) return res.status(500).send('Error updating book');
    if (result.affectedRows === 0) return res.status(404).send('Book not found');
    res.send('Book updated successfully');
  });
});

app.delete('/books/:isbn', (req, res) => {
  const { isbn } = req.params;
  const sql = 'DELETE FROM BOOK WHERE ISBN = ?';
  db.query(sql, [isbn], (err, result) => {
    if (err) return res.status(500).send('Error deleting book');
    if (result.affectedRows === 0) return res.status(404).send('Book not found');
    res.send('Book deleted successfully');
  });
});

// CRUD for Members
app.get('/members', (req, res) => {
  db.query('SELECT * FROM MEMBER', (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.post('/members', (req, res) => {
  const { Name, Email } = req.body;
  const sql = 'INSERT INTO MEMBER (Name, Email) VALUES (?, ?)';
  db.query(sql, [Name, Email], (err, result) => {
    if (err) return res.status(500).send('Error adding member');
    const memberId = result.insertId;
    res.send(`Member added successfully. Your Member ID is ${memberId}`);
  });
});

app.put('/members/:id', (req, res) => {
  const memberId = req.params.id;
  const { Name, Email } = req.body;
  const sql = 'UPDATE MEMBER SET Name = ?, Email = ? WHERE Member_ID = ?';
  db.query(sql, [Name, Email, memberId], (err, result) => {
    if (err) return res.status(500).send('Error updating member details');
    if (result.affectedRows === 0) return res.status(404).send('Member not found');
    res.send(`Member details updated. New email is: ${Email}`);
  });
});

app.delete('/members/:id', (req, res) => {
  const memberId = req.params.id;
  const sql = 'DELETE FROM MEMBER WHERE Member_ID = ?';
  db.query(sql, [memberId], (err, result) => {
    if (err) return res.status(500).send('Error deleting member');
    if (result.affectedRows === 0) return res.status(404).send('Member not found');
    res.send('Member removed');
  });
});

// Borrow a book
app.post('/borrow', (req, res) => {
  const { member_id, book_id } = req.body;

  const bookQuery = 'SELECT Status FROM BOOK WHERE Book_ID = ?';

  db.query(bookQuery, [book_id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Internal server error.' });
    if (results.length === 0) return res.status(404).json({ message: 'Book not found.' });

    const book = results[0];
    if (book.Status === 'Available') {
      db.query('UPDATE BOOK SET Status = "CheckedOut" WHERE Book_ID = ?', [book_id], (err) => {
        if (err) return res.status(500).json({ message: 'Error updating book status.' });

        const today = new Date();
        const dateDue = new Date(today);
        dateDue.setDate(today.getDate() + 7);

        const insertBorrowedQuery = 'INSERT INTO borrowed (member_id, book_id, date_of_borrowing) VALUES (?, ?, ?)';
        
        db.query(insertBorrowedQuery, [member_id, book_id, today], (err, result) => {
          if (err) return res.status(500).json({ message: 'Error inserting borrow record.' });

          db.query('UPDATE MEMBER SET Book_ID = ? WHERE Member_ID = ?', [book_id, member_id], (err) => {
            if (err) return res.status(500).json({ message: 'Error updating member record.' });

            // Check if there's an active reservation for this member and book
            const reservationQuery = `
              SELECT Reservation_ID 
              FROM reservation 
              WHERE Member_ID = ? AND Book_ID = ? AND Status = "Active"
            `;

            db.query(reservationQuery, [member_id, book_id], (resErr, resResults) => {
              if (resErr) return res.status(500).json({ message: 'Error checking reservation status.' });

              if (resResults.length > 0) {
                // If there's an active reservation, mark it as completed
                const reservationId = resResults[0].Reservation_ID;
                const updateReservationQuery = 'UPDATE reservation SET Status = "Completed" WHERE Reservation_ID = ?';

                db.query(updateReservationQuery, [reservationId], (updateResErr) => {
                  if (updateResErr) return res.status(500).json({ message: 'Error updating reservation status.' });

                  // Update the member's reservation ID to NULL
                  const updateMemberQuery = 'UPDATE member SET Reservation_ID = NULL WHERE Member_ID = ?';

                  db.query(updateMemberQuery, [member_id], (updateMemberErr) => {
                    if (updateMemberErr) return res.status(500).json({ message: 'Error updating member reservation.' });

                    res.json({
                      success: true,
                      message: 'Book borrowed successfully. Reservation status updated to Completed and Member Reservation ID cleared.',
                      date_due: dateDue.toISOString().split('T')[0]
                    });
                  });
                });
              } else {
                // If no active reservation, just confirm borrowing
                res.json({
                  success: true,
                  message: 'Book borrowed successfully. No active reservation to update.',
                  date_due: dateDue.toISOString().split('T')[0]
                });
              }
            });
          });
        });
      });
    } else {
      res.status(400).json({ message: 'Book is currently unavailable.' });
    }
  });
});



// Check reservations by member ID
app.get('/reservations', (req, res) => {
  const { member_id } = req.query;

  const reservationQuery = `
    SELECT 
      r.Reservation_ID, 
      r.Book_ID, 
      b.Title AS Book_Title, 
      b.Status AS Book_Status
    FROM reservation r 
    JOIN book b ON r.Book_ID = b.Book_ID 
    WHERE r.Member_ID = ?
      AND r.Status = 'Active'
  `;

  db.query(reservationQuery, [member_id], (err, results) => {
    if (err) {
      console.error('Error fetching reservations:', err);
      return res.status(500).json({ error: 'Error fetching reservations' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No reservations found for this Member ID.' });
    }

    res.json(results);
  });
});
app.post('/reserve', (req, res) => {
  const { member_id, book_id } = req.body;

  const bookQuery = 'SELECT Status FROM BOOK WHERE Book_ID = ?';
  db.query(bookQuery, [book_id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Internal server error.' });
    if (results.length === 0) return res.status(404).json({ message: 'Book not found.' });

    const book = results[0];

    if (book.Status === 'CheckedOut') {
      const today = new Date();

      const insertReservationQuery = 'INSERT INTO reservation (Status, Reservation_date, Member_ID, Book_ID) VALUES ("Active", ?, ?, ?)';
      db.query(insertReservationQuery, [today, member_id, book_id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Error inserting reservation record.' });

        const reservationId = result.insertId;

        db.query('UPDATE MEMBER SET Reservation_ID = ?, Book_ID = ? WHERE Member_ID = ?', [reservationId, book_id, member_id], (err) => {
          if (err) return res.status(500).json({ message: 'Error updating member record.' });

          res.json({ success: true, message: 'Book reserved successfully.' });
        });
      });
    } else if (book.Status === 'Available') {
      res.status(400).json({ message: 'Book is currently available. No reservation needed.' });
    } else {
      res.status(400).json({ message: 'Book is currently unavailable for reservation.' });
    }
  });
});

//WORKING RETURN
app.post('/return-book', (req, res) => {
  const { bookId, returnDate } = req.body;
  const returnDateObj = new Date(returnDate);

  const getBorrowedStatusQuery = 'SELECT member_id, date_due, date_of_borrowing FROM borrowed WHERE book_id = ? AND date_returned IS NULL';
  db.query(getBorrowedStatusQuery, [bookId], (err, results) => {
    if (err) {
      console.error('Error fetching borrow status:', err);
      return res.status(500).json({ error: 'Error fetching borrow status' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Book is not borrowed or already returned.' });
    }

    const dueDate = new Date(results[0].date_due);
    const memberId = results[0].member_id;
    const dateBorrowed = new Date(results[0].date_borrowed);
    let fine = 0;

    // Calculate fine if the book is returned late
    if (returnDateObj > dueDate) {
      const extraDays = Math.ceil((returnDateObj - dueDate) / (1000 * 60 * 60 * 24));
      fine = extraDays * 10;
    }

    const statusMessage = returnDateObj > dueDate ? 'Returned Late' : 'Returned On Time';

    db.query('UPDATE borrowed SET date_returned = ? WHERE book_id = ? AND date_returned IS NULL', [returnDateObj, bookId], (updateErr) => {
      if (updateErr) {
        console.error('Error updating borrowed record:', updateErr);
        return res.status(500).json({ error: 'Error updating borrowed record' });
      }

      db.query('UPDATE BOOK SET Status = "Available" WHERE Book_ID = ?', [bookId], (updateBookErr) => {
        if (updateBookErr) {
          console.error('Error updating book status:', updateBookErr);
          return res.status(500).json({ error: 'Error updating book status' });
        }

        db.query('UPDATE MEMBER SET Book_ID = NULL WHERE Member_ID = ?', [memberId], (updateMemberErr) => {
          if (updateMemberErr) {
            console.error('Error updating member record:', updateMemberErr);
            return res.status(500).json({ error: 'Error updating member record' });
          }

          db.query('INSERT INTO transaction (Book_ID, Member_ID, Fine) VALUES (?, ?, ?)', [bookId, memberId, fine], (transactionErr) => {
            if (transactionErr) {
              console.error('Error inserting transaction record:', transactionErr);
              return res.status(500).json({ error: 'Error inserting transaction record' });
            }

            res.json({ success: true, message: statusMessage, fine });
          });
        });
      });
    });
  });
});
