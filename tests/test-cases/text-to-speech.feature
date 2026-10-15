Feature: Text-to-speech readout

  As a logged-in user
  I want to generate audio for the generated story
  So that I can listen to the story

  Background:
    Given I am authenticated
    And I am on the "/Home" page

  Scenario: Play readout button is disabled when no story is available
    When I load the page without generating a story
    Then the "Play Readout" button should be disabled

  Scenario: Creating audio shows a loading state
    Given a story is visible
    When I click "Play Readout"
    Then I should see a "Creating audio..." status

  Scenario: A valid readout response renders an audio player
    Given a story is visible
    When I click "Play Readout"
    Then I should see an HTML5 audio player

  Scenario: Handle audio generation failure gracefully
    Given a story is visible
    When the readout service returns an error
    Then I should see an audio error message
    And the story text should stay visible
