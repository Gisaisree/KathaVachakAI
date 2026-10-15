Feature: Authentication (login & sign up)

  As a user
  I want to create an account and log in
  So that I can access the protected story generation page

  Background:
    Given the application is running

  Scenario: Login page validates required fields
    When I open "/login"
    And I click "Log in" without entering credentials
    Then I should see an error message about required fields

  Scenario: Sign up page validates gmail and password match
    When I open "/signup"
    And I enter a non-gmail email
    And I enter passwords that do not match
    And I click "Create account"
    Then I should see a validation error message

  Scenario: Protected route bounces but preserves intended destination
    When I open "/Home" without being authenticated
    Then I should be redirected to "/login"
    And the login redirect should not lose the intended path
