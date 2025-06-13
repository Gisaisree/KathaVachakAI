import React from 'react';
import './ReadBooks.css';  // Importing the CSS file

const ReadBooks = () => {
  // Array of 20 books with their titles, PDFs, and images
  const books = [
    { title: 'The Story of Bagh Bhairav Temple', pdf: 'The Story of Bagh Bhairav Temple.pdf', image: 'The Story of Bagh Bhairav Temple.png' },
    { title: 'Which way is South', pdf: 'Which way is South.pdf', image: 'Which way is South.png' },
    { title: "Too Much Noise', Too Much Noise.pdf",pdf: "Too Much Noise.pdf", image: 'Too Much Noise.png' },
    { title: 'Tug of War – a fable', pdf: 'Tug of War – a fable.pdf', image: 'Tug of War – a fable.png' },
    { title: 'Why Do Sunflowers Love the Sun_', pdf: 'Why Do Sunflowers Love the Sun_.pdf', image: 'Why Do Sunflowers Love the Sun.png' },
    { title: "Gods Story Book", pdf: "Gods Story Book.pdf", image: 'gods_story.png' },
    { title: 'Sunkeshi The Princess with Golden Hair', pdf: 'Sunkeshi The Princess with Golden Hair.pdf', image: 'Sunkeshi The Princess with Golden Hair.png' },
    { title: 'Tania Tells a Story', pdf: 'Tania Tells a Story.pdf', image: 'Tania Tells a Story.png' },
    { title: 'The Evening Storyteller', pdf: 'The Evening Storyteller.pdf', image: 'The Evening Storyteller.png' },
    { title: 'Finding Pluto', pdf: 'Finding Pluto.pdf', image: 'Finding Pluto.png' },
    { title: 'The Plan of the Cunning Fox', pdf: 'The Plan of the Cunning Fox.pdf', image: 'The Plan of the Cunning Fox.png' },
    { title: 'The Lantern Girl', pdf: 'The Lantern Girl.pdf', image: 'The Lantern Girl.png' },
    { title: 'Ginger the Giraffe – Monkey Pen', pdf: 'Ginger the Giraffe – Monkey Pen.pdf', image: 'Ginger the Giraffe – Monkey Pen.png' },
    { title: 'Teddys Strange Problem – Understanding Feelings', pdf: 'Teddys Strange Problem – Understanding Feelings.pdf', image: 'teddy_problem.png' },
    { title: 'What If', pdf: 'What If.pdf', image: 'What If.png' },
    { title: 'Hide and Seek – Monkey Pen', pdf: 'Hide and Seek – Monkey Pen.pdf', image: 'Hide and Seek – Monkey Pen.png' },
    { title: 'Unni’s Wish', pdf: 'Unni’s Wish.pdf', image: 'Unni’s Wish.png' },
    { title: 'The Little Bird Blue', pdf: 'The Little Bird Blue.pdf', image: 'bird_blue.png' },
    { title: 'The Magic Pitcher – Tales from the Sanskrit for Children', pdf: 'The Magic Pitcher – Tales From the Sanskrit for Children.pdf', image: 'magic_pitcher.png' },
    { title: 'The Mighty Solar Panel – A Story of Solar Energy', pdf: 'The Mighty Solar Panel – A story of solar energy.pdf', image: 'solar_panel.png' },
  ];

  return (
    <div className="read-books-page">
      <h1 id="heading">Read Story Books</h1>
      <div className="books-grid">
        {books.map((book, index) => (
          <div key={index} className="book">
            <a href={`${process.env.PUBLIC_URL}/pdfs/${book.pdf}`} target="_blank" rel="noopener noreferrer">
              <img src={`${process.env.PUBLIC_URL}/images/${book.image}`} alt={book.title} className="book-image" />
              <p>{book.title}</p>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReadBooks;
