Feature: Application navigation and routing

  As a user
  I want to navigate between pages
  So that I can access frontpage, book reading, and auth flows

  Background:
    Given the application is running

  Scenario: Load the frontpage at "/"
    When I open the homepage
    Then I should see the app title "KathaVaachak"
    And I should see a "Read Books" action
    And I should see a link to "Login"
    And I should see a link to "Sign Up"

  Scenario: Navigate to ReadBooks
    When I click "Read Books"
    Then I should be on the "/ReadBooks" page
    And I should see the heading "Read Story Books"

  Scenario: Navigate to login from the frontpage
    When I click "Login"
    Then I should be on the "/login" page
    And I should see the heading "Login"

  Scenario: Navigate to sign up from the frontpage
    When I click "Sign Up"
    Then I should be on the "/signup" page
    And I should see the heading "Sign Up"

  Scenario: Protected route redirects to login when not authenticated
    When I directly open "/Home" without a token
    Then I should be redirected to "/login"
    And I should see a message indicating login is required
