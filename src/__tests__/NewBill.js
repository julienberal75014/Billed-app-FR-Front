/**
 * @jest-environment jsdom
 */

import { localStorageMock } from "../__mocks__/localStorage.js";
import userEvent from "@testing-library/user-event";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import BillsUI from "../views/BillsUI.js";
import router from "../app/Router.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { fireEvent, waitFor, screen } from "@testing-library/dom";
import mockStore from "../__mocks__/store";


describe("When I am on NewBill Page", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "employee@test-td",
        password: "employee",
        status: "connected",
      })
    );
    const root = document.createElement("div")
    root.setAttribute("id", "root")
    document.body.appendChild(root)
    router()
    window.onNavigate(ROUTES_PATH["NewBill"]);
  });
  test("Then mail icon in vertical layout should be highlighted ", async () => {
    await waitFor(() => screen.getByTestId("icon-mail"));
    const windowIcon = screen.getByTestId("icon-mail");
    expect(windowIcon.classList.contains("active-icon")).toBe(true);

  });

  test("Then it should show the new bill form", () => {
    expect(screen.getByTestId("form-new-bill")).toBeTruthy();
  });

  describe("When I select a file and the file format is valid", () => {
    test('it should update the input field', () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      const newBillObject = new NewBill({
        document,
        onNavigate: (pathname) => document.body.innerHTML = ROUTES({ pathname }),
        store: mockStore,
        localStorage: window.localStorage
      })
      window.onNavigate(ROUTES_PATH["NewBill"]);
      const handle = jest.fn((e) => newBillObject.handleChangeFile(e))
      const inputFile = screen.getByTestId('file')
      const img = new File(['img'], 'image.png', { type: 'image/png' })

      inputFile.addEventListener('change', (e) => {
        handle(e)
      })
      fireEvent.change(inputFile, {
        target: {
          files: [img],
        },
      })


      expect(handle).toHaveBeenCalled()
      expect(inputFile.files[0]).toStrictEqual(img)
      expect(inputFile.files[0].name).toBe('image.png')


    })


  });

  describe("When I select a file and the file format is not valid", () => {
    test('it should not update the input field', () => {

      const html = NewBillUI()
      document.body.innerHTML = html
      const newBillObject = new NewBill({
        document,
        onNavigate: (pathname) => document.body.innerHTML = ROUTES({ pathname }),
        store: mockStore,
        localStorage: window.localStorage
      })
      window.alert = jest.fn();

      const handle = jest.fn((e) => newBillObject.handleChangeFile(e))
      const inputFile = screen.getByTestId('file')

      inputFile.addEventListener('change', (e) => {
        handle(e)
      })
      const file = new File(['img'], 'test.pdf', { type: 'application/pdf' })
      userEvent.upload(inputFile, file)
      expect(handle).toHaveBeenCalled()

      expect(inputFile.files[0]).toStrictEqual(file)
      expect(inputFile.files[0].name).toBe('test.pdf')
      expect(window.alert).toBeCalled()



    })

  })

  describe("when i click on the submit button", () => {

    test("the handleSubmit function is called", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      const onNavigate = pathname => {
        const html = ROUTES({ pathname, data: [] });
        document.body.innerHTML = html;
      };
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: null,
      });
      const btnSendBill = screen.getByTestId("form-new-bill");

      const handleSubmitMock = jest.fn((e) => newBill.handleSubmit(e));
      btnSendBill.addEventListener("submit", handleSubmitMock);
      fireEvent.submit(btnSendBill);
      expect(handleSubmitMock).toHaveBeenCalled();
      expect(screen.getByText("Mes notes de frais")).toBeTruthy;
    });

    test("the handleSubmit function is executed with informations provided && send to the mock API POST", async () => {

      const store = null;

      const newBillObject = new NewBill({
        document,
        onNavigate,
        store,
        localStorage,
      });


      const billInformations = {
        type: "Transports",
        name: "Bordeaux",
        date: "2022-08-15",
        amount: 100,
        vat: "20",
        pct: 20,
        commentary: "test",
        fileUrl: "C:\Users\james\OneDrive\Images\Architecure_Contrast.png",
        fileName: null,
        status: "pending",
      }


      screen.getByTestId('amount').value = billInformations.amount
      screen.getByTestId('expense-name').value = billInformations.name
      screen.getByTestId('expense-type').value = billInformations.type
      screen.getByTestId('datepicker').value = billInformations.date
      screen.getByTestId('vat').value = billInformations.vat
      screen.getByTestId('pct').value = billInformations.pct
      screen.getByTestId('commentary').value = billInformations.commentary

      const btnSendBill = screen.getByTestId("form-new-bill");

      const handleSubmitMock = jest.fn((e) => newBillObject.handleSubmit(e));
      btnSendBill.addEventListener("submit", handleSubmitMock);
      fireEvent.submit(btnSendBill);
      expect(handleSubmitMock).toHaveBeenCalled();

      const postSpy = jest.spyOn(mockStore, 'bills');
      const bills = mockStore.bills(billInformations);
      expect(postSpy).toHaveBeenCalledTimes(1);
      expect((await bills.list()).length).toBe(4);

    });


    test("Then it should send the new bill to the mock API POST and fails with 404 message error", async () => {

      mockStore.bills.mockImplementationOnce(() => {
        return {
          create: () => {
            return Promise.resolve({ fileUrl: 'https://localhost:3456/images/test.jpg', key: '1234' })
          },
          update: () => {
            return Promise.reject(new Error("Erreur 404"))
          }
        }
      })

      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const html = BillsUI({ error: "Erreur 404" });
      document.body.innerHTML = html;
      const message = screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
      console.error = jest.fn()
      expect.assertions(1);
      try {
        mockStore.bills
      } catch {
        expect(error).toEqual(console.error)
      }
    });

    test("Then it should send the new bill to the mock API POST and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"))
          },
          create: () => {
            return Promise.reject(new Error("Erreur 500"))
          },
          update: () => {
            return Promise.reject(new Error("Erreur 404"))
          }

        }
      });
      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const html = BillsUI({ error: "Erreur 500" });
      document.body.innerHTML = html;
      const message = screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
      console.error = jest.fn()
      expect.assertions(1);
      try {
        mockStore.bills
      } catch {
        expect(error).toEqual(console.error)
      }
    });



  });
})



