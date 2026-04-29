import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

export function useSocket(salaoId, {
  onEstadoCompleto,
  onAtendimentoAtualizado,
  onNovoAtendimento,
  onPropostaAtendimento,
  onVirouOffline,
  onAvisoPresenca,
} = {}) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!salaoId) return;

    const token = localStorage.getItem('token');
    const socket = io('/', {
      auth: { token },
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('entrar_sala_usuario', { salaoId });
    });

    if (onEstadoCompleto)        socket.on('estado_completo',        onEstadoCompleto);
    if (onAtendimentoAtualizado) socket.on('atendimento_atualizado', onAtendimentoAtualizado);
    if (onNovoAtendimento)       socket.on('novo_atendimento',       onNovoAtendimento);
    if (onPropostaAtendimento)   socket.on('proposta_atendimento',   onPropostaAtendimento);
    if (onVirouOffline)          socket.on('virou_offline',          onVirouOffline);
    if (onAvisoPresenca)         socket.on('aviso_presenca',         onAvisoPresenca);

    return () => socket.disconnect();
  }, [salaoId]);

  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  const getSocket = useCallback(() => socketRef.current, []);

  return { emit, getSocket };
}

export function useSocketPublico(salaoId, clienteId, { onEstadoCompleto } = {}) {
  useEffect(() => {
    if (!salaoId) return;

    const socket = io('/');
    socket.on('connect', () => {
      socket.emit('entrar_sala_salao', { salaoId, clienteId });
    });

    if (onEstadoCompleto) socket.on('estado_completo', onEstadoCompleto);

    return () => socket.disconnect();
  }, [salaoId, clienteId]);
}
