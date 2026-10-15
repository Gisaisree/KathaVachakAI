Feature: Story generation

  As a logged-in user
  I want to generate a story from a prompt
  So that I can read a new story

  Background:
    Given I am authenticated
    And I am on the "/Home" page

  Scenario: Valid story generation shows the generated story
    When I enter a story prompt text
    And I select a genre
    And I enter a word count within the allowed range
    And I click "Generate Story"
    Then I should see the section "Generated Story"
    And the generated story text should not be empty

  Scenario: Form validation requires a prompt
    When I click "Generate Story" without entering a prompt
    Then I should see a validation error for the prompt

  Scenario: Form validation requires a genre
    When I enter a story prompt text
    And I click "Generate Story" without selecting a genre
    Then I should see a validation error for the genre

  Scenario: Form validation requires a word count within range
    When I enter a story prompt text
    And I select a genre
    And I enter a word count outside the allowed range
    And I click "Generate Story"
    Then I should see a validation error for the word count

  Scenario: Show configuration error when API base URL is missing
    Given the API base URL is not configured
    When I open the "/Home" page
    Then I should see a configuration error banner
