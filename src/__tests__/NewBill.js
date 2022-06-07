/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES } from "../constants/routes.js";


// window.alert = jest.fn()
jest.spyOn(window, 'alert').mockImplementation(() => { });

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then the form is displayed", () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const html = NewBillUI()
      document.body.innerHTML = html
      expect(screen.getByTestId('form-new-bill')).toBeTruthy()
    })

    describe('When I am on Bills Page, i click on "Browse" for upload an image file', () => {
      test('Then I should sent an image file', () => {
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        const html = NewBillUI()
        document.body.innerHTML = html
        const newBill = new NewBill({
          document,
          onNavigate,
          store: null,
          localStorage: window.localStorage,
        })
        const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))
        const selectFile = screen.getByTestId('file')
        const testFile = new File(['This is a test'], 'test.jpg', {
          type: 'image/jpeg',
        })

        selectFile.addEventListener('change', handleChangeFile)
        //Les Events correspondent aux événements que vous pouvez simuler sur le DOM
        fireEvent.change(selectFile, { target: { files: [testFile] } })

        expect(handleChangeFile).toHaveBeenCalled()
        expect(selectFile.files[0]).toStrictEqual(testFile)
      })

      test("Then I should not sent a non image file", () => {
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        const html = NewBillUI()
        document.body.innerHTML = html
        const newBill = new NewBill({
          document,
          onNavigate,
          store: null,
          localStorage: window.localStorage,
        })
        const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))
        const selectFile = screen.getByTestId('file')
        const testFile = new File(['This is a test'], 'test.txt', {
          type: 'text/plain',
        })

        selectFile.addEventListener('change', handleChangeFile)
        fireEvent.change(selectFile, { target: { files: [testFile] } })

        expect(handleChangeFile).toHaveBeenCalled()
        expect(window.alert).toHaveBeenCalled()
      })
    })

    describe('When I post a new bill', () => {
      test('Then I should be sent to the Bills page', async () => {
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))
        const html = NewBillUI()
        document.body.innerHTML = html
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        const newBill = new NewBill({
          document,
          onNavigate,
          store: null,
          localStorage: window.localStorage,
        })
        const formNewBill = screen.getByTestId('form-new-bill')
        expect(formNewBill).toBeTruthy()

        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
        formNewBill.addEventListener('submit', handleSubmit)
        //event de soumission du formulaire simulé dans le DOM
        fireEvent.submit(formNewBill)
        expect(handleSubmit).toHaveBeenCalled()
        expect(screen.getByText('Mes notes de frais')).toBeTruthy()
      })
    })
  })
})
