Feature: Read Books (PDF list and open)

  As a user
  I want to browse available story books
  So that I can open a pdf to read

  Background:
    Given the application is running

  Scenario: Visiting ReadBooks shows a grid of books
    When I open "/ReadBooks"
    Then I should see the heading "Read Story Books"
    And I should see multiple book items
    And each book item should have an image
    And each book item should have a link to a pdf

  Scenario: Opening a book link targets a PDF in a new tab
    Given I am on the "/weadBooks" page
    When I click on the first book link
    Then the link should have target "_blank"
