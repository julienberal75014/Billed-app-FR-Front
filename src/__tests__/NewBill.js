/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom'
import { fireEvent, screen, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import router from "../app/Router.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"


describe("Given I am connected as an employee", () => {

  Object.defineProperty(window, 'localStorage', { value: localStorageMock })
  window.localStorage.setItem('user', JSON.stringify({
    type: 'Employee'
  }))

  describe("When I am on NewBill Page", () => {
    test("Then mail icon in vertical layout should be highlighted", async () => {

      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId('icon-mail'))
      const windowIcon = screen.getByTestId('icon-mail')
      const iconActivated = windowIcon.classList.contains('active-icon')
      expect(iconActivated).toBeTruthy()

    })
  })


  describe("When I come to the NewBill Page and all the fields should be empty", () => {
    test("Then the NewBill's form should be loaded with its fields", () => {

      const html = NewBillUI()
      document.body.innerHTML = html

      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
      expect(screen.getByTestId("expense-type")).toBeTruthy();
      expect(screen.getByTestId("expense-name")).toBeTruthy();
      expect(screen.getByTestId("datepicker")).toBeTruthy();
      expect(screen.getByTestId("amount")).toBeTruthy();
      expect(screen.getByTestId("vat")).toBeTruthy();
      expect(screen.getByTestId("pct")).toBeTruthy();
      expect(screen.getByTestId("commentary")).toBeTruthy();
      expect(screen.getByTestId("file")).toBeTruthy();
      expect(screen.getByRole("button")).toBeTruthy();

    })
  })

  describe("When I am on NewBill Page and upload a image in the correct format", () => {
    test("then the image must be uploaded", () => {

      const html = NewBillUI();
      document.body.innerHTML = html;
      window.alert = () => { };

      const onNavigate = (pathname) => {
        document.body.innerHTML = pathname;
      };
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const mockHandleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))
      const fileInput = screen.getByTestId("file");
      expect(fileInput).toBeTruthy();

      fileInput.addEventListener("change", mockHandleChangeFile);
      fireEvent.change(fileInput, {
        target: {
          files: [new File(["test.jpg"], "test.jpg", { type: "test/jpg" })],
        },
      });

      expect(mockHandleChangeFile).toHaveBeenCalled();
      expect(fileInput.files[0].name).toBe("test.jpg");

      jest.spyOn(window, "alert").mockImplementation(() => { });
      expect(window.alert).not.toHaveBeenCalled();


    })
  })
  describe("When I am on NewBill Page and upload a image in the incorrect format", () => {
    test("then the image must not be uploaded", () => {

      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = (pathname) => {
        document.body.innerHTML = pathname;
      };
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const mockHandleChangeFile = jest.fn(newBill.handleChangeFile);

      const fileInput = screen.getByTestId("file");
      expect(fileInput).toBeTruthy();

      fileInput.addEventListener("change", mockHandleChangeFile);
      fireEvent.change(fileInput, {
        target: {
          files: [new File(["test.pdf"], "test.pdf", { type: "test/pdf" })],
        },
      });
      expect(mockHandleChangeFile).toHaveBeenCalled();
      expect(fileInput.files[0].name).not.toBe("test.jpg");

      jest.spyOn(window, "alert").mockImplementation(() => { });
      expect(window.alert).toHaveBeenCalled();

    })
  })

  describe("When I am on NewBill Page and i fill out all the fields to post my new bill", () => {
    test("Then the NewBill must be sent to the bills page", () => {

      const html = NewBillUI()
      document.body.innerHTML = html

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage
      })

      const form = screen.getByTestId('form-new-bill')

      const handleSubmit = jest.fn(newBill.handleSubmit)
      form.addEventListener('submit', handleSubmit)
      fireEvent.submit(form)

      expect(handleSubmit).toHaveBeenCalled()
      expect(screen.getAllByText('Mes notes de frais')).toBeTruthy()

    })

    test('fetches error from an API and fails with 500 error', async () => {
      jest.spyOn(mockStore, 'bills')
      jest.spyOn(console, 'error').mockImplementation(() => { })

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      Object.defineProperty(window, 'location', { value: { hash: ROUTES_PATH['NewBill'] } })

      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: "a@a" }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      mockStore.bills.mockImplementationOnce(() => {
        return {
          update: () => {
            return Promise.reject(new Error('Erreur 500'))
          }
        }
      })
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })

      const form = screen.getByTestId('form-new-bill')
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
      form.addEventListener('submit', handleSubmit)
      fireEvent.submit(form)
      await new Promise(process.nextTick)
      expect(console.error).toBeCalled()
    })

    test('fetches error from an API and fails with 404 error', async () => {
      jest.spyOn(mockStore, 'bills')
      jest.spyOn(console, 'error').mockImplementation(() => { })

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      Object.defineProperty(window, 'location', { value: { hash: ROUTES_PATH['NewBill'] } })

      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: "a@a" }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      mockStore.bills.mockImplementationOnce(() => {
        return {
          update: () => {
            return Promise.reject(new Error('Erreur 404'))
          }
        }
      })
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })

      const form = screen.getByTestId('form-new-bill')
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
      form.addEventListener('submit', handleSubmit)
      fireEvent.submit(form)
      await new Promise(process.nextTick)
      expect(console.error).toBeCalled()
    })
  })

})
