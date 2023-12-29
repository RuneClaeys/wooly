export const useTrpcClient = () => {
  return useNuxtApp().$client;
};
