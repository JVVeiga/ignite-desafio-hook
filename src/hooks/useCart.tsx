import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const cartModify = [...cart];
      const productCart = cartModify.find(product => product.id === productId);
      const stockAmount = (await api.get(`stock/${productId}`)).data.amount;
      const amount = (productCart ? productCart.amount : 0) + 1;

      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      if (!productCart) {
        const product = (await api.get(`products/${productId}`)).data;
        cartModify.push({
          ...product,
          amount: 1
        });
        
      } else {
        productCart.amount = amount;
      }
      setCart(cartModify);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartModify));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const cartModify = [...cart];
      const findProduct = cartModify.findIndex(p => p.id === productId);
      if (findProduct !== -1) {
        cartModify.splice(findProduct, 1);
        setCart(cartModify);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartModify));
      } else {
        throw new Error();
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return;

      const stockAmount = (await api.get(`stock/${productId}`)).data.amount;
      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const cartModify = [...cart];
      const productCart = cartModify.find(p => p.id === productId);
      
      if (productCart) {
        productCart.amount = amount;
        setCart(cartModify);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartModify));
      } else {
        throw new Error();
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
