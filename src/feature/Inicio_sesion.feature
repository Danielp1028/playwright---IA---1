@login_functionality
Feature: Login functionality
    As a user
    I want to be able to log in to the application
    So that I can access my account

    Background:
        Given I am on the login page
    @Login_1
    Scenario: Successful login with valid credentials
        When Inicio de sesion con el usuario "ID 01"
        And I click the login button
        Then I should be logged in successfully
        And I should be redirected to the dashboard
    @login_2
    Scenario: Failed login with invalid credentials
        When Inicio de sesion con el usuario "ID 02"
        And I click the login button
        Then I should see an error message
        And I should remain on the login page
    @login_3
    Scenario: Login with empty fields
        When I leave the username field empty
        And I leave the password field empty
        And I click the login button
        Then I should see validation messages for required fields