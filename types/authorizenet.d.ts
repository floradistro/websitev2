/**
 * Type definitions for authorizenet package
 * This file provides TypeScript definitions for the Authorize.net SDK
 */

declare module "authorizenet" {
  export namespace APIContracts {
    enum MessageTypeEnum {
      OK = "Ok",
      ERROR = "Error",
    }

    enum TransactionTypeEnum {
      AUTHCAPTURETRANSACTION = "authCaptureTransaction",
      AUTHONLYTRANSACTION = "authOnlyTransaction",
      CAPTUREONLYTRANSACTION = "captureOnlyTransaction",
      REFUNDTRANSACTION = "refundTransaction",
      VOIDTRANSACTION = "voidTransaction",
    }

    class MerchantAuthenticationType {
      setName(name: string): void;
      setTransactionKey(key: string): void;
    }

    class OpaqueDataType {
      setDataDescriptor(descriptor: string): void;
      setDataValue(value: string): void;
    }

    class PaymentType {
      setOpaqueData(data: OpaqueDataType): void;
    }

    class CustomerAddressType {
      setFirstName(name: string): void;
      setLastName(name: string): void;
      setAddress(address: string): void;
      setCity(city: string): void;
      setState(state: string): void;
      setZip(zip: string): void;
      setCountry(country: string): void;
      setPhoneNumber(phone: string): void;
      setEmail(email: string): void;
    }

    class LineItemType {
      setItemId(id: string): void;
      setName(name: string): void;
      setQuantity(quantity: number): void;
      setUnitPrice(price: number): void;
    }

    class ArrayOfLineItem {
      getLineItem(): LineItemType[];
    }

    class TransactionRequestType {
      setTransactionType(type: TransactionTypeEnum): void;
      setPayment(payment: PaymentType): void;
      setAmount(amount: number): void;
      setBillTo(address: CustomerAddressType): void;
      setLineItems(items: ArrayOfLineItem): void;
    }

    class CreateTransactionRequest {
      setMerchantAuthentication(auth: MerchantAuthenticationType): void;
      setTransactionRequest(request: TransactionRequestType): void;
      getJSON(): any;
    }

    class TransactionResponse {
      getTransId(): string;
      getResponseCode(): string;
      getMessages(): any;
    }

    class CreateTransactionResponse {
      constructor(response: any);
      getMessages(): {
        getResultCode(): MessageTypeEnum;
        getMessage(): Array<{ getText(): string }>;
      };
      getTransactionResponse(): TransactionResponse;
    }
  }

  export namespace APIControllers {
    namespace SDKConstants {
      namespace endpoint {
        const sandbox: string;
        const production: string;
      }
    }

    class CreateTransactionController {
      constructor(request: any);
      setEnvironment(env: string): void;
      execute(callback: () => void): void;
      getResponse(): any;
    }
  }
}
